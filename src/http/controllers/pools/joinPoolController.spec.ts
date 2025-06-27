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
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Join Pool Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));
    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to join a pool by poolId', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        poolId: pool.id,
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: pool.name,
        isPrivate: pool.isPrivate,
      })
    );
  });

  it('should be able to join a pool by inviteCode', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'private-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
      isPrivate: true,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inviteCode: pool.inviteCode,
        poolId: pool.id, // Optional, but can be included
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toEqual(
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
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when trying to join a pool with invalid invite code', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'some-other-guy@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
      isPrivate: true,
    });

    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inviteCode: 'invalid-invite-code',
        poolId: pool.id,
      });
    console.log(JSON.stringify(response, null, 2));

    expect(response.statusCode).toEqual(401);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 422 when neither poolId nor inviteCode is provided', async () => {
    const response = await request(app.server)
      .post('/pools/join')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.statusCode).toEqual(422);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when user is already a participant in the pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'already-joined-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
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
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('already a participant');
  });

  it('should require authentication', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const owner = await createUser(usersRepository, {
      email: 'auth-test-pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
    });

    const response = await request(app.server).post('/pools/join').send({
      poolId: pool.id,
    });

    expect(response.statusCode).toEqual(401);
  });
});
