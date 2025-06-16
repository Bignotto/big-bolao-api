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

describe('Get Prediction Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;
  let tournamentId: number;
  let pool: Pool;
  let match: Match;
  let prediction: Prediction;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let teamsRepository: ITeamsRepository;
  let matchesRepository: IMatchesRepository;
  let predictionsRepository: IPredictionsRepository;

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

    prediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get prediction successfully when user owns the prediction', async () => {
    const response = await request(app.server)
      .get(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('prediction');
    expect(response.body.prediction).toEqual(
      expect.objectContaining({
        id: prediction.id,
        userId: userId,
        poolId: pool.id,
        matchId: match.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    );
  });

  it('should return 404 when prediction does not exist', async () => {
    const nonExistentPredictionId = 9999;

    const response = await request(app.server)
      .get(`/predictions/${nonExistentPredictionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Prediction not found');
  });

  it('should return 403 when user tries to access another users prediction', async () => {
    // Create another user and their prediction
    const otherUser = await createUser(usersRepository, {
      email: 'other-user@example.com',
    });

    const otherUserPool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId,
      isPrivate: false,
    });

    const otherUserPrediction = await createPrediction(predictionsRepository, {
      userId: otherUser.id,
      poolId: otherUserPool.id,
      matchId: match.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    const response = await request(app.server)
      .get(`/predictions/${otherUserPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('You can only access your own predictions');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(`/predictions/${prediction.id}`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle invalid prediction ID parameter', async () => {
    const response = await request(app.server)
      .get('/predictions/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(422);
    expect(response.body).toHaveProperty('message', 'Validation error.');
    expect(response.body).toHaveProperty('issues');
  });

  it('should return prediction with all expected properties', async () => {
    const response = await request(app.server)
      .get(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.prediction).toHaveProperty('id');
    expect(response.body.prediction).toHaveProperty('userId');
    expect(response.body.prediction).toHaveProperty('poolId');
    expect(response.body.prediction).toHaveProperty('matchId');
    expect(response.body.prediction).toHaveProperty('predictedHomeScore');
    expect(response.body.prediction).toHaveProperty('predictedAwayScore');
    expect(response.body.prediction).toHaveProperty('predictedHasExtraTime');
    expect(response.body.prediction).toHaveProperty('predictedHasPenalties');
    expect(response.body.prediction).toHaveProperty('updatedAt');
  });

  it('should get prediction with extra time and penalties for knockout matches', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Knockout Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Knockout Away Team' });

    const knockoutMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(),
        stadium: 'Knockout Stadium',
        matchStatus: 'SCHEDULED',
        matchStage: 'QUARTER_FINAL',
      },
      homeTeam,
      awayTeam
    );

    const knockoutPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: knockoutMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 4,
      penaltyAwayScore: 3,
    });

    const response = await request(app.server)
      .get(`/predictions/${knockoutPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.prediction).toEqual(
      expect.objectContaining({
        id: knockoutPrediction.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      })
    );
  });

  it('should handle negative prediction ID gracefully', async () => {
    const response = await request(app.server)
      .get('/predictions/-1')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Prediction not found');
  });

  it('should handle zero prediction ID gracefully', async () => {
    const response = await request(app.server)
      .get('/predictions/0')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Prediction not found');
  });

  it('should return consistent response structure', async () => {
    const response = await request(app.server)
      .get(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      prediction: expect.any(Object),
    });
    expect(Object.keys(response.body)).toEqual(['prediction']);
  });
});
