import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../../db/index.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../middleware/error.handler.js';
import { config } from '../../config/index.js';
import { sendEmail, buildCampaignEmail } from '../../services/email.service.js';

const TRAINER_ROLES = ['admin', 'trainer'];

function requireTrainer(req: Request, _res: Response, next: (err?: unknown) => void) {
  if (!req.user || !TRAINER_ROLES.includes(req.user.role)) {
    return next(new ForbiddenError('Trainer or admin access required.'));
  }
  next();
}

const router = Router();

router.use(requireAuth);

// GET /api/v1/campaigns — list campaigns
router.get('/', requireTrainer, async (req: Request, res: Response) => {
  const result = await query(
    `SELECT
       camp.*,
       c.title AS course_title,
       COUNT(cr.id) AS total_recipients,
       COUNT(cr.id) FILTER (WHERE cr.status = 'completed') AS completed_count,
       COUNT(cr.id) FILTER (WHERE cr.status IN ('failed')) AS failed_count
     FROM campaigns camp
     JOIN courses c ON c.id = camp.course_id
     LEFT JOIN campaign_recipients cr ON cr.campaign_id = camp.id
     WHERE camp.created_by = $1 AND camp.status != 'archived'
     GROUP BY camp.id, c.title
     ORDER BY camp.created_at DESC`,
    [req.user!.id]
  );

  res.json({ success: true, data: result.rows });
});

// POST /api/v1/campaigns — create campaign
router.post('/', requireTrainer, async (req: Request, res: Response) => {
  const { title, course_id, due_date, passing_score = 70 } = req.body;
  if (!title || !course_id) throw new ValidationError('title and course_id are required');

  const course = await query('SELECT id FROM courses WHERE id = $1 AND is_active = true', [course_id]);
  if (!course.rows[0]) throw new NotFoundError('Course not found');

  const result = await query(
    `INSERT INTO campaigns (title, course_id, created_by, due_date, passing_score)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, course_id, req.user!.id, due_date ?? null, passing_score]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/v1/campaigns/:id — get campaign with recipients
router.get('/:id', requireTrainer, async (req: Request, res: Response) => {
  const campResult = await query(
    `SELECT camp.*, c.title AS course_title
     FROM campaigns camp
     JOIN courses c ON c.id = camp.course_id
     WHERE camp.id = $1`,
    [req.params.id]
  );

  if (!campResult.rows[0]) throw new NotFoundError('Campaign not found');

  const recipientsResult = await query(
    `SELECT cr.*, u.name AS user_name
     FROM campaign_recipients cr
     LEFT JOIN users u ON u.id = cr.user_id
     WHERE cr.campaign_id = $1
     ORDER BY cr.email`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      ...campResult.rows[0],
      recipients: recipientsResult.rows
    }
  });
});

// PUT /api/v1/campaigns/:id — update campaign (draft only)
router.put('/:id', requireTrainer, async (req: Request, res: Response) => {
  const { title, due_date, passing_score } = req.body;

  const existing = await query('SELECT id, status FROM campaigns WHERE id = $1 AND created_by = $2', [
    req.params.id,
    req.user!.id
  ]);
  if (!existing.rows[0]) throw new NotFoundError('Campaign not found');
  if (existing.rows[0].status !== 'draft') throw new ValidationError('Only draft campaigns can be edited');

  const result = await query(
    `UPDATE campaigns SET
       title         = COALESCE($1, title),
       due_date      = COALESCE($2, due_date),
       passing_score = COALESCE($3, passing_score)
     WHERE id = $4
     RETURNING *`,
    [title ?? null, due_date ?? null, passing_score ?? null, req.params.id]
  );

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /api/v1/campaigns/:id — archive (soft delete)
router.delete('/:id', requireTrainer, async (req: Request, res: Response) => {
  const existing = await query('SELECT id FROM campaigns WHERE id = $1 AND created_by = $2', [
    req.params.id,
    req.user!.id
  ]);
  if (!existing.rows[0]) throw new NotFoundError('Campaign not found');

  await query(
    `UPDATE campaigns SET status = 'archived' WHERE id = $1`,
    [req.params.id]
  );

  res.json({ success: true });
});

// POST /api/v1/campaigns/:id/recipients — add recipients
router.post('/:id/recipients', requireTrainer, async (req: Request, res: Response) => {
  const { emails } = req.body; // string[]
  if (!Array.isArray(emails) || emails.length === 0) throw new ValidationError('emails array is required');

  const existing = await query('SELECT id, status FROM campaigns WHERE id = $1 AND created_by = $2', [
    req.params.id,
    req.user!.id
  ]);
  if (!existing.rows[0]) throw new NotFoundError('Campaign not found');
  if (existing.rows[0].status !== 'draft') throw new ValidationError('Cannot add recipients to a sent campaign');

  // Resolve user_ids for known users
  const userResult = await query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email = ANY($1)`,
    [emails]
  );
  const userMap = new Map(userResult.rows.map((u) => [u.email.toLowerCase(), u.id]));

  const values = emails.map((email: string) => ({
    campaign_id: req.params.id,
    user_id: userMap.get(email.toLowerCase()) ?? null,
    email: email.toLowerCase(),
    token: randomUUID()
  }));

  // Batch insert
  for (const v of values) {
    await query(
      `INSERT INTO campaign_recipients (campaign_id, user_id, email, token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (campaign_id, email) DO NOTHING`,
      [v.campaign_id, v.user_id, v.email, v.token]
    );
  }

  res.json({ success: true, data: { added: values.length } });
});

// POST /api/v1/campaigns/:id/send — send emails to all recipients
router.post('/:id/send', requireTrainer, async (req: Request, res: Response) => {
  const campResult = await query(
    `SELECT camp.*, c.title AS course_title, c.is_published
     FROM campaigns camp
     JOIN courses c ON c.id = camp.course_id
     WHERE camp.id = $1 AND camp.created_by = $2`,
    [req.params.id, req.user!.id]
  );

  const campaign = campResult.rows[0];
  if (!campaign) throw new NotFoundError('Campaign not found');
  if (campaign.status !== 'draft') throw new ValidationError('Campaign already sent');
  if (!campaign.is_published) throw new ValidationError('Course must be published before sending campaign');

  const recipientsResult = await query<{ id: string; email: string; token: string; user_name?: string }>(
    `SELECT cr.id, cr.email, cr.token, u.name AS user_name
     FROM campaign_recipients cr
     LEFT JOIN users u ON u.id = cr.user_id
     WHERE cr.campaign_id = $1 AND cr.status = 'pending'`,
    [req.params.id]
  );

  if (recipientsResult.rows.length === 0) {
    throw new ValidationError('No pending recipients to send to');
  }

  // Auto-enroll known users so they see the course in their dashboard immediately
  await query(
    `INSERT INTO enrollments (user_id, course_id)
     SELECT cr.user_id, $1
     FROM campaign_recipients cr
     WHERE cr.campaign_id = $2 AND cr.user_id IS NOT NULL
     ON CONFLICT (user_id, course_id) DO NOTHING`,
    [campaign.course_id, req.params.id]
  );

  let sent = 0;
  const errors: string[] = [];

  for (const recipient of recipientsResult.rows) {
    const learnUrl = `${config.appUrl}/learn/${recipient.token}`;
    try {
      await sendEmail({
        to: recipient.email,
        subject: `לומדה חדשה: ${campaign.course_title}`,
        html: buildCampaignEmail({
          recipientName: recipient.user_name ?? '',
          courseTitle: campaign.course_title,
          orgName: config.email.fromName,
          learnUrl,
          dueDate: campaign.due_date
        })
      });

      await query(
        `UPDATE campaign_recipients SET status = 'sent', email_sent_at = NOW() WHERE id = $1`,
        [recipient.id]
      );
      sent++;
    } catch (err) {
      errors.push(recipient.email);
      console.error(`Failed to send to ${recipient.email}:`, err);
    }
  }

  await query(
    `UPDATE campaigns SET status = 'sent', sent_at = NOW() WHERE id = $1`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: { sent, failed: errors.length, failedEmails: errors }
  });
});

// GET /api/v1/campaigns/:id/analytics — campaign stats
router.get('/:id/analytics', requireTrainer, async (req: Request, res: Response) => {
  const campResult = await query(
    `SELECT camp.*, c.title AS course_title
     FROM campaigns camp
     JOIN courses c ON c.id = camp.course_id
     WHERE camp.id = $1`,
    [req.params.id]
  );
  if (!campResult.rows[0]) throw new NotFoundError('Campaign not found');

  const statsResult = await query(
    `SELECT
       COUNT(*)                                                AS total,
       COUNT(*) FILTER (WHERE status = 'completed')           AS completed,
       COUNT(*) FILTER (WHERE status = 'failed')              AS failed,
       COUNT(*) FILTER (WHERE status = 'started')             AS in_progress,
       COUNT(*) FILTER (WHERE status IN ('pending','sent'))   AS not_started,
       ROUND(AVG(score) FILTER (WHERE score IS NOT NULL), 1)  AS avg_score,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 1) AS completion_rate,
       ROUND(
         100.0 * COUNT(*) FILTER (WHERE score >= (SELECT passing_score FROM campaigns WHERE id = $1))
         / NULLIF(COUNT(*) FILTER (WHERE score IS NOT NULL), 0),
         1
       ) AS pass_rate
     FROM campaign_recipients
     WHERE campaign_id = $1`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      campaign: campResult.rows[0],
      stats: statsResult.rows[0]
    }
  });
});

// GET /api/v1/reports/compliance — compliance audit export (admin only)
router.get('/reports/compliance', requireAdmin, async (req: Request, res: Response) => {
  const { courseId, from, to, format } = req.query;

  let sql = `
    SELECT
      u.name, u.email, u.role,
      c.title AS course_title,
      e.status, e.started_at, e.completed_at,
      e.time_spent_sec,
      qs.score, qs.passed, qs.attempt_no, qs.submitted_at
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN LATERAL (
      SELECT score, passed, attempt_no, submitted_at
      FROM quiz_submissions WHERE enrollment_id = e.id
      ORDER BY submitted_at DESC LIMIT 1
    ) qs ON true
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (courseId) { params.push(courseId); sql += ` AND c.id = $${params.length}`; }
  if (from)     { params.push(from);     sql += ` AND e.completed_at >= $${params.length}`; }
  if (to)       { params.push(to);       sql += ` AND e.completed_at <= $${params.length}`; }

  sql += ' ORDER BY e.completed_at DESC';

  const result = await query(sql, params);

  if (format === 'csv') {
    const headers = ['Name','Email','Role','Course','Status','Started','Completed','Time (min)','Score','Passed','Attempts','Quiz Date'];
    const rows = result.rows.map((r) => [
      r.name, r.email, r.role, r.course_title, r.status,
      r.started_at ? new Date(r.started_at).toLocaleString('he-IL') : '',
      r.completed_at ? new Date(r.completed_at).toLocaleString('he-IL') : '',
      r.time_spent_sec ? Math.round(r.time_spent_sec / 60) : '',
      r.score ?? '', r.passed ?? '', r.attempt_no ?? '',
      r.submitted_at ? new Date(r.submitted_at).toLocaleString('he-IL') : ''
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.csv"');
    return res.send('﻿' + csv); // BOM for Excel Hebrew support
  }

  res.json({ success: true, data: result.rows });
});

export default router;
