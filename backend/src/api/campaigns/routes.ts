import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/v1/campaigns
router.post('/', (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    data: {
      id: 'campaign-id',
      message: 'Campaign created successfully'
    }
  });
});

// GET /api/v1/campaigns/:id
router.get('/:id', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      name: 'Campaign Name',
      status: 'draft'
    }
  });
});

// GET /api/v1/campaigns/:id/analytics
router.get('/:id/analytics', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      campaignId: req.params.id,
      totalSent: 100,
      totalOpened: 85,
      openRate: 85,
      completionRate: 72
    }
  });
});

export default router;
