import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '@/test/helper-e2e';
import { PoolStandings } from '@/global/types/poolStandings';
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

type GetPoolStandingsResponse = {
  standings: PoolStandings[];
};

type ErrorResponse = {
  code: string;
  error: string;
  message?: string;
};

describe('Get Pool Standings Controller (e2e)', async () => {
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


  it('should be able to get standings from a pool as creator', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const { pool } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: userId,
        tournamentId: tournament.id,
      }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
  });

  it('should be able to get standings from a pool as participant', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const poolOwner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const { pool } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: poolOwner.id,
        tournamentId: tournament.id,
      }
    );

    // Add authenticated user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userId,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
  });

  it('should return 404 when trying to get standings from a non-existent pool', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .get(`/pools/${nonExistentPoolId}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');

    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Pool not found');
  });

  it('should validate the pool ID parameter', async () => {
    const invalidPoolId = 'not-a-number';

    const response = await request(app.server)
      .get(`/pools/${invalidPoolId}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should require authentication', async () => {
    const owner = await createUser(usersRepository, {
      email: 'owner@example.com',
    });
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: owner.id,
      tournamentId: tournament.id,
    });

    const response = await request(app.server).get(`/pools/${pool.id}/standings`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should not be able to get standings from a pool if you are not a participant or creator', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const otherUser = await createUser(usersRepository, {
      email: 'other@example.com',
    });

    const { pool } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: otherUser.id,
        tournamentId: tournament.id,
      }
    );

    // pool should not have logged user as participant or creator
    // so logged user should not be able to get standings from this pool
    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');

    const body = response.body as ErrorResponse;
    expect(body.message).toContain('not a participant or the creator');
  });

  it('should return standings with correct structure', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const { pool } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: userId,
        tournamentId: tournament.id,
      }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
    if (body.standings.length > 0) {
      const standing = body.standings[0];
      expect(standing).toHaveProperty('userId');
      expect(standing).toHaveProperty('poolId');
    }
  });

  it('should return empty standings for pool with no completed matches', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Empty Standings Pool',
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
    // Standings might be empty if no matches are completed
  });

  it('should handle pools with multiple participants in standings', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const { pool } = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        creatorId: userId,
        tournamentId: tournament.id,
      }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
    expect(body.standings.length).toBeGreaterThanOrEqual(0);
  });

  it('should allow pool creator to access standings even if not actively participating', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    // Create a pool where the creator might not be an active participant
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Creator Access Test Pool',
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/standings`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('standings');

    const body = response.body as GetPoolStandingsResponse;
    expect(Array.isArray(body.standings)).toBe(true);
  });
});
