import { Router } from 'express';
import { resolveToken } from '../enrollments/routes.js';

const router = Router();

// GET /api/v1/learn/:token — resolve campaign email link
router.get('/:token', resolveToken);

export default router;
