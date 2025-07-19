import { Pool } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type UpdatePoolResponse = {
  pool: Pool;
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
  issues?: any;
};

describe('Update Pool Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;
  let pool: Pool;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    // Create a pool for testing
    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Test Pool for Update',
      description: 'This is a test pool for update tests',
      isPrivate: true,
      maxParticipants: 10,
    });
  });

  beforeEach(async () => {
    // Delete the pool if it exists
    if (pool) {
      await poolsRepository.deletePoolById(pool.id);
    }
    // Recreate the pool for each test
    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Test Pool for Update',
      description: 'This is a test pool for update tests',
      isPrivate: true,
      maxParticipants: 10,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a pool successfully', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Pool Name',
        description: 'Updated description',
        maxParticipants: 20,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toHaveProperty('id', pool.id);
    expect(body.pool.name).toBe('Updated Pool Name');
    expect(body.pool.description).toBe('Updated description');
    expect(body.pool.maxParticipants).toBe(20);
    expect(body.pool.isPrivate).toBe(true); // Should remain unchanged
  });

  it('should update only the provided fields', async () => {
    // Update only the name
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Only Name Updated',
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePoolResponse;
    expect(body.pool).toHaveProperty('name', 'Only Name Updated');
    expect(body.pool).toHaveProperty('description', pool.description);
    expect(body.pool).toHaveProperty('isPrivate', pool.isPrivate);
    expect(body.pool).toHaveProperty('maxParticipants', pool.maxParticipants);
  });

  it('should return 422 when validation fails', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Te', // Too short
      });

    expect(response.statusCode).toBe(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
    expect(body).toHaveProperty('issues');
  });

  it('should return 404 when pool does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .put(`/pools/${nonExistentPoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Pool Name',
      });

    expect(response.statusCode).toBe(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not found');
  });

  it('should return 403 when user is not the pool creator', async () => {
    const poolOwner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const otherPool = await createPool(poolsRepository, {
      creatorId: poolOwner.id,
      tournamentId: tournamentId,
      isPrivate: false,
    });

    const response = await request(app.server)
      .put(`/pools/${otherPool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Update',
      });

    expect(response.statusCode).toBe(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Not pool creator');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).put(`/pools/${pool.id}`).send({
      name: 'Unauthenticated Update',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should handle invalid pool ID parameter', async () => {
    const response = await request(app.server)
      .put('/pools/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Valid Name',
      });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should handle empty update request', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toHaveProperty('id', pool.id);
    // All fields should remain unchanged
    expect(body.pool.name).toBe(pool.name);
    expect(body.pool.description).toBe(pool.description);
    expect(body.pool.isPrivate).toBe(pool.isPrivate);
  });

  it('should update multiple fields at once', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Multi-field Update',
        description: 'Updated multiple fields',
        isPrivate: false,
        maxParticipants: 50,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePoolResponse;
    expect(body.pool.name).toBe('Multi-field Update');
    expect(body.pool.description).toBe('Updated multiple fields');
    expect(body.pool.isPrivate).toBe(false);
    expect(body.pool.maxParticipants).toBe(50);
  });

  it('should return correct response structure', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Structure Test',
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toHaveProperty('id');
    expect(body.pool).toHaveProperty('name');
    expect(body.pool).toHaveProperty('description');
    expect(body.pool).toHaveProperty('isPrivate');
    expect(body.pool).toHaveProperty('creatorId');
    expect(body.pool).toHaveProperty('tournamentId');
    expect(typeof body.pool.id).toBe('number');
    expect(typeof body.pool.name).toBe('string');
    expect(typeof body.pool.isPrivate).toBe('boolean');
  });
});
