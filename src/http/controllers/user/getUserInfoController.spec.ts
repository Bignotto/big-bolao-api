import request from 'supertest';
import { beforeAll, describe, expect, test } from 'vitest';

import { prisma } from '@/lib/prisma';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';

describe('Get User Info (e2e)', async () => {
  const app = await createTestApp();
  let token: string;

  beforeAll(async () => {
    ({ token } = await getSupabaseAccessToken(app));
  });


  test('should return user info', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        fullName: 'Test User',
        accountProvider: 'EMAIL',
        passwordHash: 'fake-hash',
      },
    });

    const response = await request(app.server)
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    const body = response.body as unknown as {
      user: { email: string; fullName: string; accountProvider: string };
    };
    expect(body.user).toEqual(
      expect.objectContaining({
        email: 'test@example.com',
        fullName: 'Test User',
        accountProvider: 'EMAIL',
      })
    );
  });

  test('should return 404 when user does not exist', async () => {
    const response = await request(app.server)
      .get('/users/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(404);
    const body404 = response.body as unknown as { message: string };
    expect(body404.message).toContain('Resource not found');
  });
});
