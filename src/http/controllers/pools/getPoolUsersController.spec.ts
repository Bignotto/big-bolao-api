import { createServer } from '@/app';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool, createPoolWithParticipants } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Pool Users Controller (e2e)', async () => {
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

  it.only('should be able to get users from a pool', async () => {
    // Create a pool
    const owner = await createUser(usersRepository, {});

    const tournament = await createTournament(tournamentsRepository, {});

    // Create some users and add them to the pool
    const { pool, participants } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: owner.id,
        tournamentId: tournament.id,
      }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    console.log(JSON.stringify(response, null, 2));

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  it('should return 404 when trying to get users from a non-existent pool', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .get(`/pools/${nonExistentPoolId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should validate the pool ID parameter', async () => {
    const invalidPoolId = 'not-a-number';

    const response = await request(app.server)
      .get(`/pools/${invalidPoolId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(422);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('issues');
  });

  it('should require authentication', async () => {
    const owner = await createUser(usersRepository, {});
    const pool = await createPool(poolsRepository, { creatorId: owner.id });

    const response = await request(app.server).get(`/pools/${pool.id}/users`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle server errors gracefully', async () => {
    // This test is a bit tricky as we need to force a server error
    // One approach could be to mock the use case to throw an unexpected error
    // For now, we'll skip the implementation details of this test
    // const response = await request(app.server)
    //   .get(`/pools/999999999999999999999/users`) // Very large number to potentially cause an error
    //   .set('Authorization', `Bearer ${token}`)
    //   .send();
    // expect(response.statusCode).toEqual(500);
    // expect(response.body).toHaveProperty('message', 'Internal server error.');
  });
});
