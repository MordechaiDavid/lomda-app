import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

const mockCourses = [
  {
    id: 'mock-course-1',
    title: 'Introduction to Compliance',
    description: 'Learn compliance basics.',
    content: [],
    quizzes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-course-2',
    title: 'Data Privacy Essentials',
    description: 'GDPR and privacy fundamentals.',
    content: [],
    quizzes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

vi.mock('../src/db/index.js', () => ({
  query: vi.fn((sql: string, params?: unknown[]) => {
    if (sql.includes('COUNT(*)')) {
      return Promise.resolve({ rows: [{ count: String(mockCourses.length) }], rowCount: 1 });
    }
    if (sql.includes('SELECT * FROM courses ORDER BY')) {
      const limit = (params?.[0] as number) ?? 20;
      const offset = (params?.[1] as number) ?? 0;
      const rows = mockCourses.slice(offset, offset + limit);
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    if (sql.includes('SELECT * FROM courses WHERE id')) {
      const id = params?.[0] as string;
      const rows = mockCourses.filter((c) => c.id === id);
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    if (sql.includes('INSERT INTO courses')) {
      const created = {
        id: 'new-uuid-1234',
        title: params?.[0] as string,
        description: params?.[1] as string,
        content: [],
        quizzes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return Promise.resolve({ rows: [created], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  }),
  pool: { end: vi.fn() }
}));

describe('Courses API', () => {

  describe('GET /api/v1/courses', () => {

    it('returns 200 with a list of courses', async () => {
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

    it('returns 200 with the course when it exists', async () => {
      const listRes = await request(app).get('/api/v1/courses');
      const firstId = listRes.body.data.courses[0]?.id;

      const res = await request(app).get(`/api/v1/courses/${firstId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(firstId);
    });

    it('returns 404 when the course does not exist', async () => {
      const res = await request(app).get('/api/v1/courses/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('COURSE_NOT_FOUND');
    });
  });

  describe('POST /api/v1/courses', () => {

    it('returns 201 and the created course', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .send({ title: 'Test Course', description: 'A test course' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data.title).toBe('Test Course');
    });
  });
});
