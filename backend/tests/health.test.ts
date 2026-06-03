import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// "describe" groups related tests — like a @Nested class in JUnit 5
describe('GET /health', () => {

  // "it" is one test — like a @Test method in JUnit 5
  it('returns 200 with status ok', async () => {
    // supertest wraps your Express app — like MockMvc.perform() in Spring Boot
    const res = await request(app).get('/health');

    // expect(...).toBe(...) — like assertThat(...).isEqualTo(...) in AssertJ
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
