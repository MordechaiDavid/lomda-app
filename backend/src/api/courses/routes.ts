import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { NotFoundError, ForbiddenError } from '../../middleware/error.handler.js';

interface Course {
  id: string;
  title: string;
  description: string;
  content: unknown[];
  quizzes: unknown[];
  passing_score: number;
  thumbnail_url: string | null;
  background_music_url: string | null;
  is_published: boolean;
  estimated_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TRAINER_ROLES = ['admin', 'trainer'];

function requireTrainer(req: Request, _res: Response, next: (err?: unknown) => void) {
  if (!req.user || !TRAINER_ROLES.includes(req.user.role)) {
    return next(new ForbiddenError('Trainer or admin access required.'));
  }
  next();
}

const router = Router();

// GET /api/v1/courses
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    query<Course>(
      'SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [pageSize, offset]
    ),
    query<{ count: string }>('SELECT COUNT(*) FROM courses WHERE is_active = true')
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  res.json({
    success: true,
    data: {
      courses: dataResult.rows,
      total,
      page,
      pageSize,
      hasMore: offset + dataResult.rows.length < total
    }
  });
});

// GET /api/v1/courses/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query<Course>('SELECT * FROM courses WHERE id = $1 AND is_active = true', [req.params.id]);

  if (!result.rows[0]) {
    throw new NotFoundError('Course not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

// POST /api/v1/courses — create (trainer/admin only)
router.post('/', requireAuth, requireTrainer, async (req: Request, res: Response) => {
  const {
    title,
    description,
    content = [],
    quizzes = [],
    passing_score = 70,
    thumbnail_url,
    background_music_url,
    estimated_minutes
  } = req.body;

  const result = await query<Course>(
    `INSERT INTO courses
       (title, description, content, quizzes, passing_score, thumbnail_url, background_music_url, estimated_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      title,
      description,
      JSON.stringify(content),
      JSON.stringify(quizzes),
      passing_score,
      thumbnail_url ?? null,
      background_music_url ?? null,
      estimated_minutes ?? null
    ]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

// PUT /api/v1/courses/:id — full update (trainer/admin only)
router.put('/:id', requireAuth, requireTrainer, async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    content,
    quizzes,
    passing_score,
    thumbnail_url,
    background_music_url,
    estimated_minutes
  } = req.body;

  const existing = await query<Course>('SELECT id FROM courses WHERE id = $1 AND is_active = true', [id]);
  if (!existing.rows[0]) throw new NotFoundError('Course not found');

  const result = await query<Course>(
    `UPDATE courses SET
       title                = COALESCE($1, title),
       description          = COALESCE($2, description),
       content              = COALESCE($3, content),
       quizzes              = COALESCE($4, quizzes),
       passing_score        = COALESCE($5, passing_score),
       thumbnail_url        = COALESCE($6, thumbnail_url),
       background_music_url = COALESCE($7, background_music_url),
       estimated_minutes    = COALESCE($8, estimated_minutes),
       updated_at           = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      title ?? null,
      description ?? null,
      content != null ? JSON.stringify(content) : null,
      quizzes != null ? JSON.stringify(quizzes) : null,
      passing_score ?? null,
      thumbnail_url !== undefined ? thumbnail_url : null,
      background_music_url !== undefined ? background_music_url : null,
      estimated_minutes ?? null,
      id
    ]
  );

  res.json({ success: true, data: result.rows[0] });
});

// POST /api/v1/courses/:id/publish — publish (trainer/admin only)
router.post('/:id/publish', requireAuth, requireTrainer, async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query<Course>(
    `UPDATE courses SET is_published = true, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *`,
    [id]
  );

  if (!result.rows[0]) throw new NotFoundError('Course not found');

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /api/v1/courses/:id — soft delete (trainer/admin only)
router.delete('/:id', requireAuth, requireTrainer, async (req: Request, res: Response) => {
  const result = await query(
    `UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [req.params.id]
  );

  if (!result.rowCount || result.rowCount === 0) {
    throw new NotFoundError('Course not found');
  }

  res.json({ success: true, data: { message: 'Course deactivated.' } });
});

export default router;
