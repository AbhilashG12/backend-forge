import request from 'supertest';
import { describe, it, expect } from 'vitest';

describe('User API', () => {
  let userId: string;

  it('should create a new user', async () => {
    const res = await request('http://127.0.0.1:3002')
      .post('/users')
      .send({ email: 'test@supertest.com', name: 'John Doe' });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    userId = res.body.data.id;
  });

  it('should retrieve the user and hit the cache', async () => {
    const res = await request('http://127.0.0.1:3002').get(`/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@supertest.com');
  });
});