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

describe('Get User Pools Controller (e2e)', async () => {
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

  it('should return an empty array when user has no pools', async () => {
    const response = await request(app.server)
      .get(`/users/${userId}/pools`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');
    expect(Array.isArray(response.body.pools)).toBe(true);
    expect(response.body.pools).toHaveLength(0);
  });

  it('should be able to get pools that the user participates in', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    // Create a pool where the user is the creator
    const pool1 = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'User Created Pool',
    });

    // Create a pool where the user is a participant but not the creator
    const otherUser = await createUser(usersRepository, {
      email: 'other-creator@example.com',
    });

    const pool2 = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
      name: 'User Joined Pool',
    });

    // Add the test user as a participant to the second pool
    await poolsRepository.addParticipant({
      poolId: pool2.id,
      userId,
    });

    const response = await request(app.server)
      .get(`/users/${userId}/pools`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');
    expect(Array.isArray(response.body.pools)).toBe(true);

    // Check that both pools are returned
    const poolIds = response.body.pools.map((pool: any) => pool.id);
    expect(poolIds).toContain(pool1.id);
    expect(poolIds).toContain(pool2.id);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(`/users/${userId}/pools`).send();

    expect(response.statusCode).toEqual(401);
  });

  // it('should handle server errors gracefully', async () => {
  //   // This test would typically mock the use case to throw an unexpected error
  //   // For now, we'll just verify the controller's error handling by checking
  //   // that non-ResourceNotFoundError errors are re-thrown (which would result in a 500)
  //   // We can't easily test this directly in an e2e test without modifying the code,
  //   // so this is more of a placeholder for a potential future test
  // });
});
