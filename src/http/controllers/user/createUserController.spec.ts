import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';

type CreateUserResponse = {
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

describe('Create User Controller (e2e)', () => {
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

  it('should create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newuser@example.com',
        passwordHash: 'fake-password-hash',
        fullName: 'New Test User',
        profileImageUrl: 'https://example.com/profile.jpg',
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreateUserResponse;
    expect(body).toHaveProperty('user');
    expect(body.user).toEqual(
      expect.objectContaining({
        email: 'newuser@example.com',
        fullName: 'New Test User',
        profileImageUrl: 'https://example.com/profile.jpg',
      })
    );

    // Verify user was actually created in the database
    const createdUser = await usersRepository.findByEmail('newuser@example.com');

    expect(createdUser).not.toBeNull();
    expect(createdUser?.fullName).toBe('New Test User');
  });

  it('should return 409 when email is already in use', async () => {
    await usersRepository.create({
      email: 'duplicate@example.com',
      passwordHash: 'fake-hash',
      fullName: 'Duplicate User',
      profileImageUrl: 'https://example.com/duplicate.jpg',
    });

    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'duplicate@example.com',
        passwordHash: 'another-fake-hash',
        fullName: 'Another User',
        profileImageUrl: 'https://example.com/another.jpg',
      });

    expect(response.statusCode).toBe(409);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Email already in use');
  });

  it('should return 400 when validation fails', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invalid-email',
        passwordHash: 'fake-hash',
        fullName: 'Invalid User',
        profileImageUrl: 'https://example.com/invalid.jpg',
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/email must match format "email"');
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'missing@example.com',
        // Missing other required fields
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', `body must have required property 'fullName'`);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).post('/users').send({
      email: 'unauthenticated@example.com',
      passwordHash: 'fake-hash',
      fullName: 'Unauthenticated User',
      profileImageUrl: 'https://example.com/unauth.jpg',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should create a user with optional id field', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: 'custom-user-id',
        email: 'customid@example.com',
        passwordHash: 'fake-password-hash',
        fullName: 'Custom ID User',
        profileImageUrl: 'https://example.com/custom.jpg',
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreateUserResponse;
    expect(body.user).toEqual(
      expect.objectContaining({
        id: 'custom-user-id',
        email: 'customid@example.com',
        fullName: 'Custom ID User',
        profileImageUrl: 'https://example.com/custom.jpg',
      })
    );
  });

  it('should handle all required fields validation', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing all required fields
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should return user with all expected properties', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'properties@example.com',
        passwordHash: 'fake-password-hash',
        fullName: 'Properties Test User',
        profileImageUrl: 'https://example.com/properties.jpg',
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreateUserResponse;
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('fullName');
    expect(body.user).toHaveProperty('profileImageUrl');
    expect(body.user).not.toHaveProperty('passwordHash'); // Should not expose password hash
  });

  it('should return consistent response structure', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'structure@example.com',
        passwordHash: 'fake-password-hash',
        fullName: 'Structure Test User',
        profileImageUrl: 'https://example.com/structure.jpg',
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreateUserResponse;
    expect(Object.keys(body)).toEqual(['user']);
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('fullName');
    expect(body.user).toHaveProperty('profileImageUrl');
  });

  it('should handle invalid email format', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'not-an-email',
        passwordHash: 'fake-password-hash',
        fullName: 'Invalid Email User',
        profileImageUrl: 'https://example.com/invalid-email.jpg',
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', `body/email must match format "email"`);
  });

  it('should handle empty string values', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: '',
        passwordHash: '',
        fullName: '',
        profileImageUrl: '',
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', `body/email must match format "email"`);
  });
});
