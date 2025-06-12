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

describe('Get Pool Controller (e2e)', async () => {
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

  it.only('should be able to get pool details as creator', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Test Pool',
      description: 'Test pool description',
      isPrivate: false,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    //NEXT: pool is missing scoring rules
    //TODO: add scoring rules to pool in createPool mock
    console.log(JSON.stringify(response, null, 2));
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Test Pool',
        description: 'Test pool description',
        isPrivate: false,
        creatorId: userId,
        tournamentId: tournament.id,
        isCreator: true,
        isParticipant: true, // Creator is automatically a participant
      })
    );
    expect(response.body.pool).toHaveProperty('scoringRules');
    expect(response.body.pool).toHaveProperty('participantsCount');
  });

  it('should be able to get pool details as participant', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const poolOwner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolOwner.id,
      tournamentId: tournament.id,
      name: 'Participant Test Pool',
    });

    // Add authenticated user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userId,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Participant Test Pool',
        creatorId: poolOwner.id,
        tournamentId: tournament.id,
        isCreator: false,
        isParticipant: true,
      })
    );
  });

  it('should return 404 when pool does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .get(`/pools/${nonExistentPoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Pool not found');
  });

  it('should return 403 when user is not a participant or creator', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const otherUser = await createUser(usersRepository, {
      email: 'other-user@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
      name: 'Private Pool',
    });

    // Authenticated user is not a participant and not the creator
    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not a participant');
  });

  it('should validate the pool ID parameter', async () => {
    const invalidPoolId = 'not-a-number';

    const response = await request(app.server)
      .get(`/pools/${invalidPoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(422);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Validation error.');
    expect(response.body).toHaveProperty('issues');
  });

  it('should require authentication', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const response = await request(app.server).get(`/pools/${pool.id}`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should include tournament information when available', async () => {
    const tournament = await createTournament(tournamentsRepository, {
      name: 'World Cup 2024',
      status: 'UPCOMING',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Tournament Info Test Pool',
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.pool).toHaveProperty('tournament');
    expect(response.body.pool.tournament).toEqual(
      expect.objectContaining({
        id: tournament.id,
        name: 'World Cup 2024',
        status: 'UPCOMING',
      })
    );
  });

  it('should return correct participant count', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const { pool, participants } = await createPoolWithParticipants(
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
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.pool).toHaveProperty('participantsCount');
    expect(typeof response.body.pool.participantsCount).toBe('number');
    expect(response.body.pool.participantsCount).toBeGreaterThan(0);
  });

  it('should include scoring rules in response', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Scoring Rules Test Pool',
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.pool).toHaveProperty('scoringRules');
    expect(response.body.pool.scoringRules).toEqual(
      expect.objectContaining({
        exactScorePoints: expect.any(Number),
        correctWinnerPoints: expect.any(Number),
        correctDrawPoints: expect.any(Number),
        correctWinnerGoalDiffPoints: expect.any(Number),
        finalMultiplier: expect.any(Number),
        knockoutMultiplier: expect.any(Number),
      })
    );
  });

  it('should handle private pools correctly', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Private Pool Test',
      isPrivate: true,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.pool).toEqual(
      expect.objectContaining({
        isPrivate: true,
      })
    );
  });
});
