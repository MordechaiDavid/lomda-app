import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';

interface Course {
  id: string;
  title: string;
  description: string;
  content: unknown[];
  quizzes: unknown[];
  created_at: string;
  updated_at: string;
}

const router = Router();

// GET /api/v1/courses
router.get('/', async (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
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
    return res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found'
      }
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// POST /api/v1/courses
router.post('/', async (req: Request, res: Response) => {
  const { title, description, content = [], quizzes = [] } = req.body;

  const result = await query<Course>(
    `INSERT INTO courses (title, description, content, quizzes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, JSON.stringify(content), JSON.stringify(quizzes)]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE courses SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );

  if (!result.rowCount || result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found'
      }
    });
  }

  res.json({
    success: true,
    data: { message: 'Course deactivated.' }
  });
});




export default router;
