import { createServer } from '@/app';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { PrismaTeamsRepository } from '@/repositories/teams/PrismaTeamsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatch } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';
import { Match, Pool, Prediction } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Pool Predictions Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;
  let tournamentId: number;
  let pool: Pool;

  let predictions: Prediction[];

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let teamsRepository: ITeamsRepository;
  let matchesRepository: IMatchesRepository;
  let predictionsRepository: IPredictionsRepository;

  let match: Match;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    teamsRepository = new PrismaTeamsRepository();
    matchesRepository = new PrismaMatchesRepository();
    predictionsRepository = new PrismaPredictionsRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      isPrivate: false,
    });

    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team' });

    match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(),
        stadium: 'Test Stadium',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam,
      awayTeam
    );

    const prediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    predictions = [prediction];
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get pool predictions for pool creator', async () => {
    const response = await request(app.server)
      .get(`/pools/${pool.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('predictions');
    expect(Array.isArray(response.body.predictions)).toBe(true);
    expect(response.body.predictions.length).toBeGreaterThan(0);
    expect(response.body.predictions[0]).toHaveProperty('id');
    expect(response.body.predictions[0]).toHaveProperty('poolId', pool.id);
    expect(response.body.predictions[0]).toHaveProperty('userId', userId);
  });

  it('should get pool predictions for pool participant', async () => {
    //Create other user to be the pool creater and the original user a participant
    const otherUser = await createUser(usersRepository, {});

    const otherPool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId,
      isPrivate: false,
    });

    await poolsRepository.addParticipant({ poolId: otherPool.id, userId: userId });

    await createPrediction(predictionsRepository, {
      userId: otherUser.id,
      poolId: otherPool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('predictions');
    expect(Array.isArray(response.body.predictions)).toBe(true);
  });

  it('should return 403 when user is not a participant or creator', async () => {
    const otherUser = await createUser(usersRepository, {});

    // Create a new pool where the other user is not a participant
    const newPool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId,
      isPrivate: true,
    });

    const response = await request(app.server)
      .get(`/pools/${newPool.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain(
      'Not participant: User is not a participant or the creator of the pool'
    );
  });

  it('should return 404 when pool does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .get(`/pools/${nonExistentPoolId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('not found');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(`/pools/${pool.id}/predictions`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle invalid pool ID parameter', async () => {
    const response = await request(app.server)
      .get('/pools/invalid-id/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(422);
    expect(response.body).toHaveProperty('message', 'Validation error.');
  });
});
