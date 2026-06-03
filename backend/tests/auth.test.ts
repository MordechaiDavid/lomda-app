import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

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
      expect(res.body.data.user.password).toBeUndefined(); // never leak the password
      // cookie should be set
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
        .send({ email: VALID_EMAIL }); // no password

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
      // First login to get the cookie — like @BeforeEach login in Spring Security tests
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: VALID_EMAIL, password: VALID_PASSWORD });

      const cookie = loginRes.headers['set-cookie'];

      // Then use that cookie on /me
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
