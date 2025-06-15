import { createServer } from '@/app';
import { env } from '@/env/config';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { it } from 'node:test';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('Get User Info (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));
  });

  afterAll(async () => {
    await app.close();
  });

  test('should return user info', async () => {
    const response = await request(app.server)
      .get(`/users/me`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        email: env.TEST_USER_EMAIL,
        fullName: 'John Tester',
        accountProvider: 'EMAIL',
      })
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    const response = await request(app.server).get(`/users/me`).send();
    expect(response.statusCode).toEqual(401);
  });
});
