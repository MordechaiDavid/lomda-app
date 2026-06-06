import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { NotFoundError, ValidationError } from '../../middleware/error.handler.js';

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  current_step: number;
  time_spent_sec: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const router = Router();

// All enrollment routes require authentication
router.use(requireAuth);

// POST /api/v1/enrollments — enroll current user in a course
router.post('/', async (req: Request, res: Response) => {
  const { course_id } = req.body;
  if (!course_id) throw new ValidationError('course_id is required');

  const course = await query('SELECT id, is_active FROM courses WHERE id = $1', [course_id]);
  if (!course.rows[0] || !course.rows[0].is_active) throw new NotFoundError('Course not found');

  const result = await query<EnrollmentRow>(
    `INSERT INTO enrollments (user_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, course_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [req.user!.id, course_id]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/v1/enrollments/my — list current user's enrollments with course info
router.get('/my', async (req: Request, res: Response) => {
  const result = await query(
    `SELECT
       e.*,
       c.title            AS course_title,
       c.description      AS course_description,
       c.thumbnail_url    AS course_thumbnail_url,
       c.estimated_minutes AS course_estimated_minutes,
       c.passing_score    AS course_passing_score,
       qs.score           AS latest_score
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN LATERAL (
       SELECT score FROM quiz_submissions
       WHERE enrollment_id = e.id
       ORDER BY submitted_at DESC
       LIMIT 1
     ) qs ON true
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [req.user!.id]
  );

  res.json({ success: true, data: result.rows });
});

// GET /api/v1/enrollments/:id — get single enrollment (must belong to current user)
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query<EnrollmentRow>(
    'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.id]
  );

  if (!result.rows[0]) throw new NotFoundError('Enrollment not found');
  res.json({ success: true, data: result.rows[0] });
});

// PUT /api/v1/enrollments/:id/progress — save step progress and time
router.put('/:id/progress', async (req: Request, res: Response) => {
  const { current_step, time_spent_sec } = req.body;

  const existing = await query<EnrollmentRow>(
    'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.id]
  );
  if (!existing.rows[0]) throw new NotFoundError('Enrollment not found');

  const result = await query<EnrollmentRow>(
    `UPDATE enrollments SET
       current_step   = GREATEST(current_step, COALESCE($1, current_step)),
       time_spent_sec = COALESCE($2, time_spent_sec),
       status         = CASE
                          WHEN status = 'pending' THEN 'in_progress'
                          ELSE status
                        END,
       started_at     = COALESCE(started_at, NOW())
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [current_step ?? null, time_spent_sec ?? null, req.params.id, req.user!.id]
  );

  res.json({ success: true, data: result.rows[0] });
});

// POST /api/v1/enrollments/:id/quiz — submit quiz answers, calculate score
router.post('/:id/quiz', async (req: Request, res: Response) => {
  const { answers } = req.body; // Record<questionId, selectedOptionId>
  if (!answers || typeof answers !== 'object') throw new ValidationError('answers object is required');

  const enrollmentResult = await query<EnrollmentRow & { course_id: string }>(
    'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user!.id]
  );
  const enrollment = enrollmentResult.rows[0];
  if (!enrollment) throw new NotFoundError('Enrollment not found');

  // Load course to get quiz questions and passing score
  const courseResult = await query<{ content: string; quizzes: string; passing_score: number }>(
    'SELECT content, quizzes, passing_score FROM courses WHERE id = $1',
    [enrollment.course_id]
  );
  const course = courseResult.rows[0];
  if (!course) throw new NotFoundError('Course not found');

  // Extract questions from quiz blocks inside content and legacy quizzes field
  type Question = { id: string; correctOptionId?: string; correctAnswer?: string; options?: { id: string; text: string }[] };
  const content = course.content as unknown as { type: string; questions?: Question[] }[];
  const legacyQuizzes = course.quizzes as unknown as Question[];

  const allQuestions: Question[] = [
    ...content.filter((b) => b.type === 'quiz').flatMap((b) => b.questions ?? []),
    ...legacyQuizzes
  ];

  if (allQuestions.length === 0) {
    // No quiz — mark complete directly
    const completed = await query<EnrollmentRow>(
      `UPDATE enrollments SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *`,
      [enrollment.id]
    );
    return res.json({ success: true, data: { score: 100, passed: true, enrollment: completed.rows[0] } });
  }

  // Calculate score
  let correct = 0;
  for (const question of allQuestions) {
    const submitted = answers[question.id];
    if (!submitted) continue;
    // New format: correctOptionId; legacy format: correctAnswer matched against option text
    const isCorrect =
      question.correctOptionId
        ? submitted === question.correctOptionId
        : question.options?.find((o) => o.id === submitted)?.text === question.correctAnswer;
    if (isCorrect) correct++;
  }

  const score = Math.round((correct / allQuestions.length) * 100);
  const passed = score >= course.passing_score;

  // Get attempt number
  const attemptResult = await query<{ count: string }>(
    'SELECT COUNT(*) FROM quiz_submissions WHERE enrollment_id = $1',
    [enrollment.id]
  );
  const attempt_no = parseInt(attemptResult.rows[0].count, 10) + 1;

  // Save submission
  await query(
    `INSERT INTO quiz_submissions (enrollment_id, user_id, course_id, answers, score, passed, attempt_no)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [enrollment.id, req.user!.id, enrollment.course_id, JSON.stringify(answers), score, passed, attempt_no]
  );

  // Update enrollment status
  const updatedEnrollment = await query<EnrollmentRow>(
    `UPDATE enrollments
     SET status = $1, completed_at = CASE WHEN $2 THEN NOW() ELSE completed_at END
     WHERE id = $3
     RETURNING *`,
    [passed ? 'completed' : 'failed', passed, enrollment.id]
  );

  // If accessed via campaign token, update recipient status
  const token = req.headers['x-campaign-token'] as string | undefined;
  if (token) {
    await query(
      `UPDATE campaign_recipients
       SET status = $1, score = $2, completed_at = CASE WHEN $3 THEN NOW() ELSE completed_at END
       WHERE token = $4`,
      [passed ? 'completed' : 'failed', score, passed, token]
    );
  }

  res.json({
    success: true,
    data: {
      score,
      passed,
      passing_score: course.passing_score,
      attempt_no,
      enrollment: updatedEnrollment.rows[0]
    }
  });
});

// GET /api/v1/learn/:token — resolve campaign token to enrollment context
// (mounted separately in app.ts as /api/v1/learn)
export async function resolveToken(req: Request, res: Response) {
  const { token } = req.params;

  const result = await query(
    `SELECT
       cr.*,
       c.id            AS course_id,
       c.title         AS course_title,
       c.passing_score AS passing_score,
       c.is_published  AS is_published
     FROM campaign_recipients cr
     JOIN campaigns camp ON camp.id = cr.campaign_id
     JOIN courses c ON c.id = camp.course_id
     WHERE cr.token = $1`,
    [token]
  );

  const recipient = result.rows[0];
  if (!recipient) throw new NotFoundError('Invalid or expired link');
  if (!recipient.is_published) throw new NotFoundError('This course is not yet available');

  // Mark as started if first visit
  if (recipient.status === 'sent' || recipient.status === 'pending') {
    await query(
      `UPDATE campaign_recipients SET status = 'started', started_at = COALESCE(started_at, NOW()) WHERE token = $1`,
      [token]
    );
  }

  res.json({
    success: true,
    data: {
      course_id: recipient.course_id,
      course_title: recipient.course_title,
      passing_score: recipient.passing_score,
      campaign_id: recipient.campaign_id,
      recipient_status: recipient.status,
      due_date: recipient.due_date ?? null
    }
  });
}

export default router;
