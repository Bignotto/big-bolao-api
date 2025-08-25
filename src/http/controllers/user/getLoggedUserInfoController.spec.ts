import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createServer } from '@/app';
import { env } from '@/env/config';
import { getSupabaseAccessToken } from '@/test/mockJwt';

describe('Get User Info (e2e)', async () => {
  const app = await createServer();
  let token: string;

  beforeAll(async () => {
    await app.ready();
    ({ token } = await getSupabaseAccessToken(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return user info', async () => {
    const response = await request(app.server)
      .get(`/users/me`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    const body = response.body as {
      user: {
        email: string;
        fullName: string;
        accountProvider: string;
      };
    };
    expect(body.user).toEqual(
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
