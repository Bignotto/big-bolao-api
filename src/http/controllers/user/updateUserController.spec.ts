import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createUser } from '@/test/mocks/users';

type UpdateUserResponse = {
  user: {
    id: string;
    email: string;
    fullName: string;
    profileImageUrl: string;
  };
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
};

describe('Update User Controller (e2e)', () => {
  let app: FastifyInstance;
  let token: string;

  let usersRepository: IUsersRepository;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await getSupabaseAccessToken(app));
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

    const body = response.body as UpdateUserResponse;
    expect(body).toHaveProperty('user');
    expect(body.user.fullName).toEqual('Updated Name');
    expect(body.user.profileImageUrl).toEqual('https://example.com/updated-image.jpg');

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

    const body = response.body as UpdateUserResponse;
    expect(body.user).toEqual(
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

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should validate the request body', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invalid-email', // Invalid email format
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/email must match format "email"');
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

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
    expect(body).toHaveProperty('issues');
  });

  it('should require authentication', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server).put(`/users/${user.id}`).send({
      fullName: 'Unauthenticated Update',
    });

    expect(response.statusCode).toEqual(401);
  });

  it('should update only the provided fields', async () => {
    const user = await createUser(usersRepository, {
      fullName: 'Original Name',
      email: 'original@example.com',
      profileImageUrl: 'https://example.com/original.jpg',
    });

    // Update only the name
    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Only Name Updated',
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateUserResponse;
    expect(body.user).toHaveProperty('fullName', 'Only Name Updated');
    expect(body.user).toHaveProperty('email', user.email); // Should remain unchanged
    expect(body.user).toHaveProperty('profileImageUrl', user.profileImageUrl); // Should remain unchanged
  });

  it('should handle empty request body', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateUserResponse;
    expect(body).toHaveProperty('user');
    expect(body.user.id).toEqual(user.id);
  });

  it('should return user with all expected properties', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Properties Test User',
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateUserResponse;
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('fullName');
    expect(body.user).toHaveProperty('profileImageUrl');
    expect(body.user).not.toHaveProperty('passwordHash'); // Should not expose password hash
  });

  it('should return consistent response structure', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Structure Test User',
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateUserResponse;
    expect(Object.keys(body)).toEqual(['user']);
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('fullName');
    expect(body.user).toHaveProperty('profileImageUrl');
    expect(body.user).not.toHaveProperty('passwordHash'); // Should not expose password hash
  });

  it('should handle invalid email format', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'not-an-email',
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/email must match format "email"');
  });

  it('should handle empty string values', async () => {
    const user = await createUser(usersRepository, {});

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: '',
        fullName: '',
        profileImageUrl: '',
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/email must match format "email"');
  });

  it('should update all fields when provided', async () => {
    const user = await createUser(usersRepository, {});

    const updateData = {
      email: 'all-fields@example.com',
      fullName: 'All Fields Updated',
      profileImageUrl: 'https://example.com/all-fields.jpg',
    };

    const response = await request(app.server)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateUserResponse;
    expect(body.user).toEqual(
      expect.objectContaining({
        id: user.id,
        email: updateData.email,
        fullName: updateData.fullName,
        profileImageUrl: updateData.profileImageUrl,
      })
    );

    // Verify the user was actually updated in the database
    const updatedUser = await usersRepository.findById(user.id);
    expect(updatedUser?.email).toEqual(updateData.email);
    expect(updatedUser?.fullName).toEqual(updateData.fullName);
    expect(updatedUser?.profileImageUrl).toEqual(updateData.profileImageUrl);
  });
});
