import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

// ─── Mock users for auth ──────────────────────────────────────────────────────
const ADMIN_ID   = 'aaaabbbb-0000-0000-0000-000000000001';
const TRAINER_ID = 'aaaabbbb-0000-0000-0000-000000000002';
const EMPLOYEE_ID= 'aaaabbbb-0000-0000-0000-000000000003';

const ADMIN   = { id: ADMIN_ID,   email: 'admin@lomda.app',   role: 'admin',   name: 'Admin',   is_active: true };
const TRAINER = { id: TRAINER_ID, email: 'trainer@lomda.app', role: 'trainer', name: 'Trainer', is_active: true };
const EMPLOYEE= { id: EMPLOYEE_ID,email: 'employee@lomda.app',role: 'employee',name: 'Employee',is_active: true };

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function makeToken(user: typeof ADMIN) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

// ─── Mock courses ─────────────────────────────────────────────────────────────
const mockCourses = [
  {
    id: 'course-uuid-0001',
    title: 'Introduction to Compliance',
    description: 'Learn compliance basics.',
    content: '[]',
    quizzes: '[]',
    passing_score: 70,
    thumbnail_url: null,
    background_music_url: null,
    is_published: true,
    is_active: true,
    estimated_minutes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'course-uuid-0002',
    title: 'Data Privacy Essentials',
    description: 'GDPR and privacy fundamentals.',
    content: '[]',
    quizzes: '[]',
    passing_score: 80,
    thumbnail_url: null,
    background_music_url: null,
    is_published: false,
    is_active: true,
    estimated_minutes: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

vi.mock('../src/db/index.js', () => ({
  query: vi.fn((sql: string, params?: unknown[]) => {

    // requireAuth — look up user by ID
    if (sql.includes('FROM users WHERE id')) {
      const id = params?.[0];
      if (id === ADMIN_ID)    return Promise.resolve({ rows: [ADMIN],    rowCount: 1 });
      if (id === TRAINER_ID)  return Promise.resolve({ rows: [TRAINER],  rowCount: 1 });
      if (id === EMPLOYEE_ID) return Promise.resolve({ rows: [EMPLOYEE], rowCount: 1 });
      return Promise.resolve({ rows: [], rowCount: 0 });
    }

    // COUNT(*)
    if (sql.includes('COUNT(*)')) {
      const active = mockCourses.filter((c) => c.is_active);
      return Promise.resolve({ rows: [{ count: String(active.length) }], rowCount: 1 });
    }

    // List courses
    if (sql.includes('FROM courses') && sql.includes('ORDER BY created_at')) {
      const limit = (params?.[0] as number) ?? 20;
      const offset = (params?.[1] as number) ?? 0;
      const rows = mockCourses.filter((c) => c.is_active).slice(offset, offset + limit);
      return Promise.resolve({ rows, rowCount: rows.length });
    }

    // Single course by id
    if (sql.includes('FROM courses WHERE id') || sql.includes('WHERE id =')) {
      const id = params?.[0];
      const rows = mockCourses.filter((c) => c.id === id && c.is_active);
      return Promise.resolve({ rows, rowCount: rows.length });
    }

    // INSERT INTO courses
    if (sql.includes('INSERT INTO courses')) {
      const created = {
        id: 'new-course-uuid-9999',
        title: params?.[0] as string,
        description: params?.[1] as string,
        content: [],
        quizzes: [],
        passing_score: (params?.[4] as number) ?? 70,
        thumbnail_url: null,
        background_music_url: null,
        is_published: false,
        is_active: true,
        estimated_minutes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return Promise.resolve({ rows: [created], rowCount: 1 });
    }

    // UPDATE courses (soft delete or edit)
    if (sql.includes('UPDATE courses')) {
      const id = params?.[params.length - 1];
      const rows = mockCourses.filter((c) => c.id === id);
      return Promise.resolve({ rows, rowCount: rows.length });
    }

    return Promise.resolve({ rows: [], rowCount: 0 });
  }),
  pool: { end: vi.fn() }
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Courses API', () => {

  describe('GET /api/v1/courses', () => {
    it('returns 200 with a list of courses (no auth required)', async () => {
      const res = await request(app).get('/api/v1/courses');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.courses)).toBe(true);
      expect(typeof res.body.data.total).toBe('number');
    });

    it('respects pageSize query param', async () => {
      const res = await request(app).get('/api/v1/courses?pageSize=1');
      expect(res.status).toBe(200);
      expect(res.body.data.courses.length).toBeLessThanOrEqual(1);
    });

    it('returns page 2 with different results than page 1', async () => {
      const page1 = await request(app).get('/api/v1/courses?page=1&pageSize=1');
      const page2 = await request(app).get('/api/v1/courses?page=2&pageSize=1');
      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.data.courses[0]?.id).not.toBe(page2.body.data.courses[0]?.id);
    });
  });

  describe('GET /api/v1/courses/:id', () => {
    it('returns 200 with course when it exists', async () => {
      const res = await request(app).get(`/api/v1/courses/${mockCourses[0].id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockCourses[0].id);
    });

    it('returns 404 when course does not exist', async () => {
      const res = await request(app).get('/api/v1/courses/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/courses', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .send({ title: 'Test Course', description: 'A test' });
      expect(res.status).toBe(401);
    });

    it('returns 403 for employee role', async () => {
      const token = makeToken(EMPLOYEE);
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Cookie', `token=${token}`)
        .send({ title: 'Test Course', description: 'A test' });
      expect(res.status).toBe(403);
    });

    it('returns 201 for trainer role', async () => {
      const token = makeToken(TRAINER);
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Cookie', `token=${token}`)
        .send({ title: 'Test Course', description: 'A test', passing_score: 75 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.title).toBe('Test Course');
    });

    it('returns 201 for admin role', async () => {
      const token = makeToken(ADMIN);
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Cookie', `token=${token}`)
        .send({ title: 'Admin Course', description: 'Created by admin' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/courses/:id', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).delete(`/api/v1/courses/${mockCourses[0].id}`);
      expect(res.status).toBe(401);
    });

    it('returns 200 for trainer deleting an existing course', async () => {
      const token = makeToken(TRAINER);
      const res = await request(app)
        .delete(`/api/v1/courses/${mockCourses[0].id}`)
        .set('Cookie', `token=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
