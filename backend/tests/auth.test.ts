import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

const TEACHER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const TEACHER = {
  id: TEACHER_ID,
  email: 'teacher@lms.com',
  // bcrypt hash of "password123"
  password: '$2a$10$y1/97jtwomJ1l8KzWuwnUeuYhGdvFR.59LAbHIidJH2QRwNvtpUrm',
  role: 'teacher',
  name: 'Lomda Teacher'
};

vi.mock('../src/db/index.js', () => ({
  query: vi.fn((sql: string, params?: unknown[]) => {
    if (sql.includes('FROM users WHERE LOWER(email)')) {
      const email = (params?.[0] as string)?.toLowerCase();
      const rows = email === 'teacher@lms.com' ? [TEACHER] : [];
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    if (sql.includes('FROM users WHERE id')) {
      return Promise.resolve({ rows: [TEACHER], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  }),
  pool: { end: vi.fn() }
}));

const VALID_EMAIL = 'teacher@lms.com';
const VALID_PASSWORD = 'password123';

describe('Auth API', () => {

  describe('POST /api/v1/auth/login', () => {

    it('returns 200 and a token cookie on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(VALID_EMAIL);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: VALID_EMAIL, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FAILED');
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_FAILED');
    });

    it('returns 400 when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: VALID_EMAIL });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('GET /api/v1/auth/me', () => {

    it('returns 401 when no cookie is present', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns the logged-in user when a valid cookie is sent', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(VALID_EMAIL);
    });
  });

  describe('POST /api/v1/auth/logout', () => {

    it('returns 200 and clears the cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
