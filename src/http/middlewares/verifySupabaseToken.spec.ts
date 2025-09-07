import fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
  },
}));

import { verifySupabaseToken } from '@/http/middlewares/verifySupabaseToken';

describe('verifySupabaseToken middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    getUserMock.mockReset();
    app = fastify();
    app.addHook('onRequest', verifySupabaseToken);
    app.get('/protected', (req) => ({ userId: req.user.sub }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow requests with valid token', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const response = await request(app.server)
      .get('/protected')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-123' });
  });

  it('should reject requests without authorization header', async () => {
    const response = await request(app.server).get('/protected');

    expect(response.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: new Error('Invalid') });

    const response = await request(app.server)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
