import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/users
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      users: [],
      total: 0
    }
  });
});

// POST /api/v1/users/bulk-upload
router.post('/bulk-upload', (req: Request, res: Response) => {
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
router.get('/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      email: 'user@example.com',
      name: 'User Name'
    }
  });
});

export default router;
