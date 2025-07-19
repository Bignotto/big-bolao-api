import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

type JoinPoolResponse = {
  pool: {
    id: number;
    name: string;
    isPrivate: boolean;
  };
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
  issues?: string[] | string;
};

describe('Join Pool Controller (e2e)', async () => {
  const app = await createTestApp();
  let token: string;
  let tournamentId: number;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token } = await getSupabaseAccessToken(app));
    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to join a pool by poolId', async () => {
    const owner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
      isPrivate: false,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: pool.name,
        isPrivate: pool.isPrivate,
      })
    );
  });

  it('should be able to join a pool by inviteCode', async () => {
    const owner = await createUser(usersRepository, {
      email: 'private-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
      isPrivate: true,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inviteCode: pool.inviteCode,
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: pool.name,
        isPrivate: pool.isPrivate,
      })
    );
  });

  it('should return 404 when trying to join a pool that does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: nonExistentPoolId,
      });

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 401 when trying to join a pool with invalid invite code', async () => {
    const owner = await createUser(usersRepository, {
      email: 'some-other-guy@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
      isPrivate: true,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inviteCode: 'invalid-invite-code',
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(401);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 422 when validation fails', async () => {
    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: 'not-a-number', // Invalid type
      });

    expect(response.statusCode).toEqual(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
    expect(body).toHaveProperty('issues');
  });

  it('should return 401 when user is already a participant in the pool', async () => {
    const owner = await createUser(usersRepository, {
      email: 'already-joined-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
    });

    // Join the pool first time
    await request(app.server).post('/pools/join').set('Authorization', `Bearer ${token}`).send({
      poolId: pool.id,
    });

    // Try to join again
    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(401);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('already a participant');
  });

  it('should require authentication', async () => {
    const owner = await createUser(usersRepository, {
      email: 'auth-test-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
    });

    const response = await request(app.server).post('/pools/join').send({
      poolId: pool.id,
    });

    expect(response.statusCode).toEqual(401);
  });

  it('should handle missing required fields', async () => {
    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing poolId
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should join a pool with minimal required data', async () => {
    const owner = await createUser(usersRepository, {
      email: 'minimal-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
      isPrivate: false,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolResponse;
    expect(body.pool).toHaveProperty('id', pool.id);
    expect(body.pool).toHaveProperty('name', pool.name);
    expect(body.pool).toHaveProperty('isPrivate', false);
  });

  it('should return correct response structure', async () => {
    const owner = await createUser(usersRepository, {
      email: 'structure-test-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId,
      name: 'Structure Test Pool',
      isPrivate: false,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toHaveProperty('id');
    expect(body.pool).toHaveProperty('name');
    expect(body.pool).toHaveProperty('isPrivate');
    expect(typeof body.pool.id).toBe('number');
    expect(typeof body.pool.name).toBe('string');
    expect(typeof body.pool.isPrivate).toBe('boolean');
  });
});
