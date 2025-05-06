import { createServer } from '@/app';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createUser } from '@/test/mocks/users';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update User Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;

  let usersRepository: IUsersRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));
    usersRepository = new PrismaUsersRepository();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update user information', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Updated Name',
        profileImageUrl: 'https://example.com/updated-image.jpg',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.user.fullName).toEqual('Updated Name');
    expect(response.body.user.profileImageUrl).toEqual('https://example.com/updated-image.jpg');

    const updatedUser = await usersRepository.findById(user.id);

    expect(updatedUser?.fullName).toEqual('Updated Name');
    expect(updatedUser?.profileImageUrl).toEqual('https://example.com/updated-image.jpg');
  });

  it('should be able to update user email', async () => {
    const user = await createUser(usersRepository, {});

    const newEmail = 'updated-email@example.com';

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: newEmail,
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: user.id,
        email: newEmail,
      })
    );

    // Verify the user was actually updated in the database
    const updatedUser = await usersRepository.findById(user.id);

    expect(updatedUser?.email).toEqual(newEmail);
  });

  it('should return 404 when trying to update a non-existent user', async () => {
    const nonExistentUserId = 'clqwertyuiop123456789012';

    const response = await request(app.server)
      .put(`/users/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Updated Name',
      });

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should validate the request body', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invalid-email', // Invalid email format
      });

    expect(response.statusCode).toEqual(422);
  });

  it('should validate the user ID parameter', async () => {
    const invalidUserId = 'not-a-cuid';

    const response = await request(app.server)
      .put(`/users/${invalidUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Updated Name',
      });

    expect(response.statusCode).toEqual(422);
  });
});
