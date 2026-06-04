import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

const ADMIN_ID    = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EMPLOYEE_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const OTHER_ID    = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

const ADMIN = {
  id: ADMIN_ID,
  email: 'admin@lomda.app',
  role: 'admin',
  name: 'Lomda Admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const EMPLOYEE = {
  id: EMPLOYEE_ID,
  email: 'employee@lomda.app',
  role: 'employee',
  name: 'Test Employee',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

vi.mock('../src/db/index.js', () => ({
  query: vi.fn((sql: string, params?: unknown[]) => {
    // requireAuth — look up user by ID from JWT
    if (sql.includes('FROM users WHERE id')) {
      if (params?.[0] === ADMIN_ID)    return Promise.resolve({ rows: [ADMIN],    rowCount: 1 });
      if (params?.[0] === EMPLOYEE_ID) return Promise.resolve({ rows: [EMPLOYEE], rowCount: 1 });
      if (params?.[0] === OTHER_ID)    return Promise.resolve({ rows: [{ ...EMPLOYEE, id: OTHER_ID }], rowCount: 1 });
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // COUNT for list pagination
    if (sql.includes('COUNT(*)')) {
      return Promise.resolve({ rows: [{ count: '2' }], rowCount: 1 });
    }
    // List users SELECT
    if (sql.includes('SELECT id, email, role')) {
      return Promise.resolve({ rows: [ADMIN, EMPLOYEE], rowCount: 2 });
    }
    // Duplicate email check — 'taken@lomda.app' simulates an existing user
    if (sql.includes('WHERE LOWER(email)') && !sql.includes('AND id !=')) {
      const email = (params?.[0] as string)?.toLowerCase();
      if (email === 'taken@lomda.app') return Promise.resolve({ rows: [{ id: OTHER_ID }], rowCount: 1 });
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // Conflict check on update (different id)
    if (sql.includes('WHERE LOWER(email)') && sql.includes('AND id !=')) {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // INSERT new user
    if (sql.includes('INSERT INTO users')) {
      return Promise.resolve({
        rows: [{ id: OTHER_ID, email: 'new@lomda.app', role: 'employee', name: 'New User', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
        rowCount: 1
      });
    }
    // Soft delete (DELETE /:id) — only succeeds for known IDs
    if (sql.includes('is_active = false')) {
      const id = params?.[0];
      if (id === OTHER_ID || id === EMPLOYEE_ID) {
        return Promise.resolve({ rows: [{ id }], rowCount: 1 });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // UPDATE user (PUT /:id)
    if (sql.includes('UPDATE users SET')) {
      return Promise.resolve({ rows: [{ ...EMPLOYEE, name: 'Updated Name' }], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  }),
  pool: { end: vi.fn() }
}));

// Signed with the test secret from setup.ts
const ADMIN_COOKIE    = `token=${jwt.sign({ id: ADMIN_ID, email: 'admin@lomda.app', role: 'admin' }, 'test-secret', { expiresIn: '1h' })}`;
const EMPLOYEE_COOKIE = `token=${jwt.sign({ id: EMPLOYEE_ID, email: 'employee@lomda.app', role: 'employee' }, 'test-secret', { expiresIn: '1h' })}`;

describe('Users API', () => {

  describe('Auth guards', () => {
    it('returns 401 with no token', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('returns 403 for a non-admin user', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', EMPLOYEE_COOKIE);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/users', () => {
    it('returns paginated users list for admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
    });

    it('does not return passwords', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE);

      res.body.data.users.forEach((u: any) => {
        expect(u.password).toBeUndefined();
      });
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns a single user by id', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${EMPLOYEE_ID}`)
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(EMPLOYEE_ID);
    });

    it('returns 404 for a non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/users', () => {
    it('creates a user and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'New User', email: 'new@lomda.app', password: 'Secret123!', role: 'employee' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('new@lomda.app');
      expect(res.body.data.password).toBeUndefined();
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ email: 'new@lomda.app', password: 'Secret123!', role: 'employee' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'New User', email: 'not-an-email', password: 'Secret123!', role: 'employee' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'New User', email: 'new@lomda.app', password: 'short', role: 'employee' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for an invalid role', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'New User', email: 'new@lomda.app', password: 'Secret123!', role: 'superhero' });

      expect(res.status).toBe(400);
    });

    it('returns 409 when email is already taken', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'Dup User', email: 'taken@lomda.app', password: 'Secret123!', role: 'employee' });

      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('updates a user and returns the updated record', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${EMPLOYEE_ID}`)
        .set('Cookie', ADMIN_COOKIE)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('returns 400 when no fields are provided', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${EMPLOYEE_ID}`)
        .set('Cookie', ADMIN_COOKIE)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 403 when admin tries to deactivate their own account', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${ADMIN_ID}`)
        .set('Cookie', ADMIN_COOKIE)
        .send({ is_active: false });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('soft-deletes a user (deactivates)', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${OTHER_ID}`)
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('User deactivated.');
    });

    it('returns 403 when admin tries to delete their own account', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${ADMIN_ID}`)
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(403);
    });

    it('returns 404 for a non-existent user', async () => {
      const res = await request(app)
        .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', ADMIN_COOKIE);

      expect(res.status).toBe(404);
    });
  });
});
