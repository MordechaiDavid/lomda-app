import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

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
      const res = await request(app).get('/api/v1/courses?pageSize=2');

      expect(res.status).toBe(200);
      // should return at most 2 courses
      expect(res.body.data.courses.length).toBeLessThanOrEqual(2);
    });

    it('returns page 2 with different results than page 1', async () => {
      const page1 = await request(app).get('/api/v1/courses?page=1&pageSize=1');
      const page2 = await request(app).get('/api/v1/courses?page=2&pageSize=1');

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      // the first course on page 1 and page 2 should be different
      expect(page1.body.data.courses[0]?.id).not.toBe(page2.body.data.courses[0]?.id);
    });
  });

  describe('GET /api/v1/courses/:id', () => {

    it('returns 200 with the course when it exists', async () => {
      // First get the list to find a real id
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
      const newCourse = {
        id: 'test-course-1',
        title: 'Test Course',
        description: 'A test course'
      };

      const res = await request(app)
        .post('/api/v1/courses')
        .send(newCourse);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(newCourse.id);
    });
  });
});
