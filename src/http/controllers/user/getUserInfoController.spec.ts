import { createServer } from '@/app';
import { prisma } from '@/lib/prisma';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('Get User Info (e2e)', async () => {
  const app = await createServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  test('should return user info', async () => {
    // create a test user first
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        fullName: 'Test User',
        accountProvider: 'EMAIL',
        passwordHash: 'fake-hash',
      },
    });

    const response = await request(app.server).get(`/users/${user.id}`).send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        email: 'test@example.com',
        fullName: 'Test User',
        accountProvider: 'EMAIL',
      })
    );
  });

  test('should return 404 when user does not exist', async () => {
    const response = await request(app.server).get('/users/non-existent-id').send();

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      message: expect.stringContaining('Resource not found'),
    });
  });
});
