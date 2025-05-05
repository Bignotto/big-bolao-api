import { createServer } from '@/app';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create User (e2e)', async () => {
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
    expect(response.body.user).toEqual(
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
    expect(response.body).toEqual({
      message: expect.stringContaining('Email already in use'),
    });
  });

  it('should return 422 when validation fails', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invalid-email',
        passwordHash: 'fake-hash',
        fullName: 'Invalid User',
        profileImageUrl: 'https://example.com/invalid.jpg',
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.message).toBe('Validation error');
  });

  it('should return 422 when required fields are missing', async () => {
    const response = await request(app.server)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'missing@example.com',
        // Missing other required fields
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.message).toBe('Validation error');
  });
});
