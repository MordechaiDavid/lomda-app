import { Router, Request, Response } from 'express';
import { query } from '../../db/index.js';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

const router = Router();

// GET /api/v1/users
router.get('/', async (_req: Request, res: Response) => {
  const result = await query<User>(
    'SELECT id, email, role, name FROM users ORDER BY created_at DESC'
  );

  res.json({
    success: true,
    data: {
      users: result.rows,
      total: result.rowCount
    }
  });
});

// POST /api/v1/users/bulk-upload
router.post('/bulk-upload', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      imported: 0,
      failed: 0,
      message: 'Users bulk upload processed'
    }
  });
});

// GET /api/v1/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query<User>(
    'SELECT id, email, role, name FROM users WHERE id = $1',
    [req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

export default router;
