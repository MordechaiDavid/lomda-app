import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../db/index.js';
import { UnauthorizedError, ForbiddenError } from './error.handler.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedError('Authentication required.');

    let payload: { id: string; email: string; role: string };
    try {
      payload = jwt.verify(token, config.jwt.secret as string) as typeof payload;
    } catch {
      throw new UnauthorizedError('Session expired or invalid.');
    }

    const result = await query<{ id: string; email: string; role: string; is_active: boolean }>(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [payload.id]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) throw new UnauthorizedError('Authentication required.');

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required.'));
  }
  next();
}
