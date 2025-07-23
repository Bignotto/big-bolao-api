import { Match, Pool, Prediction } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatch } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type GetPredictionResponse = {
  prediction: Prediction;
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
};

describe('Get Prediction Controller (e2e)', async () => {
  const app = await createTestApp();
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
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    teamsRepository = new PrismaTeamsRepository();
    matchesRepository = new PrismaMatchesRepository();
    predictionsRepository = new PrismaPredictionsRepository();

    // Create tournament
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    // Create pool
    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      isPrivate: false,
    });

    // Create teams and match
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

    // Create prediction
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

    const body = response.body as GetPredictionResponse;
    expect(body).toHaveProperty('prediction');
    expect(body.prediction).toEqual(
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

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Prediction not found');
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

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('You can only access your own predictions');
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

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should return prediction with all expected properties', async () => {
    const response = await request(app.server)
      .get(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPredictionResponse;
    expect(body.prediction).toHaveProperty('id');
    expect(body.prediction).toHaveProperty('userId');
    expect(body.prediction).toHaveProperty('poolId');
    expect(body.prediction).toHaveProperty('matchId');
    expect(body.prediction).toHaveProperty('predictedHomeScore');
    expect(body.prediction).toHaveProperty('predictedAwayScore');
    expect(body.prediction).toHaveProperty('predictedHasExtraTime');
    expect(body.prediction).toHaveProperty('predictedHasPenalties');
    expect(body.prediction).toHaveProperty('updatedAt');
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

    const body = response.body as GetPredictionResponse;
    expect(body.prediction).toEqual(
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

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain(`params/predictionId must match pattern "^[0-9]+$"`);
  });

  it('should handle zero prediction ID gracefully', async () => {
    const response = await request(app.server)
      .get('/predictions/0')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Prediction not found');
  });

  it('should return consistent response structure', async () => {
    const response = await request(app.server)
      .get(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPredictionResponse;
    expect(body).toEqual({
      prediction: {
        id: prediction.id,
        userId: prediction.userId,
        poolId: prediction.poolId,
        matchId: prediction.matchId,
        predictedHomeScore: prediction.predictedHomeScore,
        predictedAwayScore: prediction.predictedAwayScore,
        predictedHasExtraTime: prediction.predictedHasExtraTime,
        predictedHasPenalties: prediction.predictedHasPenalties,
        predictedPenaltyHomeScore: prediction.predictedPenaltyHomeScore,
        predictedPenaltyAwayScore: prediction.predictedPenaltyAwayScore,
        updatedAt: prediction.updatedAt,
        pointsEarned: prediction.pointsEarned,
        submittedAt: prediction.submittedAt.toISOString(),
      },
    });
    expect(Object.keys(body)).toEqual(['prediction']);
  });

  it('should handle validation error with proper format', async () => {
    const response = await request(app.server)
      .get('/predictions/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', `params/predictionId must match pattern "^[0-9]+$"`);
  });
});
