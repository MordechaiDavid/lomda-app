import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/v1/auth/magic-link
router.post('/magic-link', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Magic link sent to email'
    }
  });
});

// POST /api/v1/auth/verify-token
router.post('/verify-token', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      token: 'jwt-token-here',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'User Name'
      }
    }
  });
});

// POST /api/v1/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
});

export default router;
