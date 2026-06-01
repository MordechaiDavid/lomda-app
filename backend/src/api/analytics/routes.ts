import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/analytics/dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalCourses: 10,
      totalCampaigns: 5,
      avgCompletionRate: 75
    }
  });
});

// GET /api/v1/analytics/campaigns
router.get('/campaigns', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      campaigns: []
    }
  });
});

// GET /api/v1/analytics/users
router.get('/users', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      users: []
    }
  });
});

export default router;
