import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../db/index.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../../middleware/error.handler.js';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

interface UserRow {
  id: string;
  email: string;
  role: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VALID_ROLES = ['admin', 'trainer', 'employee', 'viewer'] as const;

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/v1/users
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
  const search = req.query.search ? String(req.query.search).trim() : null;
  const offset = (page - 1) * pageSize;

  const whereClause = search
    ? `WHERE name ILIKE $3 OR email ILIKE $3`
    : '';
  const searchParam = search ? `%${search}%` : null;

  const countParams = search ? [searchParam] : [];
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM users ${search ? 'WHERE name ILIKE $1 OR email ILIKE $1' : ''}`,
    countParams
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataParams = search ? [pageSize, offset, searchParam] : [pageSize, offset];
  const result = await query<UserRow>(
    `SELECT id, email, role, name, is_active, created_at, updated_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    dataParams
  );

  res.json({
    success: true,
    data: {
      users: result.rows,
      total,
      page,
      pageSize,
      hasMore: offset + result.rows.length < total
    }
  });
});

// POST /api/v1/users/bulk-upload (keep stub before /:id)
router.post('/bulk-upload', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { imported: 0, failed: 0, message: 'Users bulk upload processed' }
  });
});

// POST /api/v1/users
router.post('/', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ValidationError('Name is required.');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ValidationError('A valid email address is required.');
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (!role || !VALID_ROLES.includes(role)) {
    throw new ValidationError(`Role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new ConflictError('A user with this email already exists.');
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await query<UserRow>(
    `INSERT INTO users (email, password, role, name, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, email, role, name, is_active, created_at, updated_at`,
    [email.toLowerCase(), hash, role, name.trim()]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/v1/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  const result = await query<UserRow>(
    'SELECT id, email, role, name, is_active, created_at, updated_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows[0]) throw new NotFoundError('User');
  res.json({ success: true, data: result.rows[0] });
});

// PUT /api/v1/users/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role, password, is_active } = req.body;

  if (is_active === false && req.user!.id === id) {
    throw new ForbiddenError('You cannot deactivate your own account.');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) throw new ValidationError('Name cannot be empty.');
    fields.push(`name = $${idx++}`);
    values.push(name.trim());
  }
  if (email !== undefined) {
    if (!EMAIL_REGEX.test(email)) throw new ValidationError('A valid email address is required.');
    const conflict = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email, id]);
    if (conflict.rowCount && conflict.rowCount > 0) throw new ConflictError('A user with this email already exists.');
    fields.push(`email = $${idx++}`);
    values.push(email.toLowerCase());
  }
  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) throw new ValidationError(`Role must be one of: ${VALID_ROLES.join(', ')}.`);
    fields.push(`role = $${idx++}`);
    values.push(role);
  }
  if (is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(Boolean(is_active));
  }
  if (password !== undefined) {
    if (password.length < PASSWORD_MIN_LENGTH) throw new ValidationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    fields.push(`password = $${idx++}`);
    values.push(await bcrypt.hash(password, 10));
  }

  if (fields.length === 0) throw new ValidationError('No fields to update.');

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<UserRow>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, email, role, name, is_active, created_at, updated_at`,
    values
  );
  if (!result.rows[0]) throw new NotFoundError('User');

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /api/v1/users/:id  (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.user!.id === id) {
    throw new ForbiddenError('You cannot delete your own account.');
  }

  const result = await query(
    `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );
  if (!result.rowCount || result.rowCount === 0) throw new NotFoundError('User');

  res.json({ success: true, data: { message: 'User deactivated.' } });
});

export default router;
