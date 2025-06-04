import { createServer } from '@/app';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';
import { Pool } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Pool Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;
  let tournamentId: number;
  let pool: Pool;
  let otherUserId: string;
  let otherUserToken: string;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    // Create a pool for testing
    const createResponse = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Pool for Update',
        description: 'This is a test pool for update tests',
        tournamentId,
        isPrivate: true,
        maxParticipants: 10,
      });

    pool = createResponse.body.pool;
  });

  afterAll(async () => {
    await app.close();
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
    expect(response.body.pool).toHaveProperty('name', 'Only Name Updated');
    expect(response.body.pool).toHaveProperty('description', pool.description);
    expect(response.body.pool).toHaveProperty('isPrivate', pool.isPrivate);
    expect(response.body.pool).toHaveProperty('maxParticipants', pool.maxParticipants);
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
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toHaveProperty('id', pool.id);
    expect(response.body.pool.name).toBe('Updated Pool Name');
    expect(response.body.pool.description).toBe('Updated description');
    expect(response.body.pool.maxParticipants).toBe(20);
    expect(response.body.pool.isPrivate).toBe(true); // Should remain unchanged
  });

  it('should return 422 when validation fails', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Te', // Too short
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty('message', 'Validation error');
    expect(response.body).toHaveProperty('issues');
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
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });

  it('should return 403 when user is not the pool creator', async () => {
    const poolOwner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolOwner.id,
      tournamentId: tournamentId,
      isPrivate: false,
    });

    const response = await request(app.server)
      .put(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Unauthorized Update',
      });

    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Not pool creator');
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

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty('message', 'Validation error');
  });
});
