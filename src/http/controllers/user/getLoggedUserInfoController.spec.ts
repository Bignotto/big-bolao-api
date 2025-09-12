import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { env } from '@/env/config';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';

describe('Get User Info (e2e)', async () => {
  const app = await createTestApp();
  let token: string;

  beforeAll(async () => {
    ({ token } = await getSupabaseAccessToken(app));
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
