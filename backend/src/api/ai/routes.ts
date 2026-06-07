import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { ForbiddenError, ValidationError } from '../../middleware/error.handler.js';
import { generateLomdaTurn, type ChatMessage } from '../../services/ai.service.js';

const TRAINER_ROLES = ['admin', 'trainer'];

function requireTrainer(req: Request, _res: Response, next: (err?: unknown) => void) {
  if (!req.user || !TRAINER_ROLES.includes(req.user.role)) {
    return next(new ForbiddenError('Trainer or admin access required.'));
  }
  next();
}

const router = Router();

// POST /api/v1/ai/lomda-chat — chat turn that can propose lomda structure
router.post('/lomda-chat', requireAuth, requireTrainer, async (req: Request, res: Response) => {
  const { messages, currentSteps } = req.body as {
    messages?: ChatMessage[];
    currentSteps?: unknown[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError('`messages` must be a non-empty array.');
  }

  const result = await generateLomdaTurn({
    messages,
    currentSteps: Array.isArray(currentSteps) ? currentSteps : []
  });

  res.json({ success: true, data: result });
});

export default router;
