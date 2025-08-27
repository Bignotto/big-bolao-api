import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '@/test/helper-e2e';
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

describe('Leave Pool Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));
    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });


  it('should be able to leave a pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'pool-owner-leave@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userId,
    });

    // Then leave the pool
    const response = await request(app.server)
      .post(`/pools/${pool.id}/leave`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
  });

  it('should return 404 when trying to leave a pool that does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .post(`/pools/${nonExistentPoolId}/leave`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 403 when trying to leave a pool that user is not a participant of', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'not-joined-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/leave`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not a participant');
  });

  it('should return 403 when trying to leave a pool as the owner', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    // Create a pool where the authenticated user is the owner
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/leave`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'Unauthorized: Pool creator cannot leave their own pool'
    );
  });

  it('should require authentication', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'auth-test-pool-owner-leave@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
    });

    const response = await request(app.server).post(`/pools/${pool.id}/leave`);

    expect(response.statusCode).toEqual(401);
  });
});
