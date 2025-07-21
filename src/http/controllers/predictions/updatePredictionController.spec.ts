import { Match, MatchStage, MatchStatus, Pool, Prediction } from '@prisma/client';
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

type UpdatePredictionResponse = {
  prediction: Prediction;
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
};

describe('Update Prediction Controller (e2e)', async () => {
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
        matchDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
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

  it('should update prediction successfully with basic scores', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 3,
        predictedAwayScore: 2,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePredictionResponse;
    expect(body).toHaveProperty('prediction');
    expect(body.prediction).toEqual(
      expect.objectContaining({
        id: prediction.id,
        userId: userId,
        poolId: pool.id,
        matchId: match.id,
        predictedHomeScore: 3,
        predictedAwayScore: 2,
        predictedHasExtraTime: false,
        predictedHasPenalties: false,
      })
    );
  });

  it('should update prediction with extra time and penalties for knockout matches', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Knockout Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Knockout Away Team' });

    const knockoutMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stadium: 'Knockout Stadium',
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.QUARTER_FINAL,
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
    });

    const response = await request(app.server)
      .put(`/predictions/${knockoutPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePredictionResponse;
    expect(body.prediction).toEqual(
      expect.objectContaining({
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      })
    );
  });

  it('should return 404 when prediction does not exist', async () => {
    const nonExistentPredictionId = 9999;

    const response = await request(app.server)
      .put(`/predictions/${nonExistentPredictionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not found');
  });

  it('should return 403 when user tries to update another users prediction', async () => {
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
      .put(`/predictions/${otherUserPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 400 when match is not scheduled', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Completed Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Completed Away Team' });

    const completedMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(),
        stadium: 'Completed Stadium',
        matchStatus: MatchStatus.COMPLETED,
        matchStage: MatchStage.GROUP,
      },
      homeTeam,
      awayTeam
    );

    const completedPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: completedMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .put(`/predictions/${completedPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Match Status');
  });

  it('should return 400 when trying to predict extra time for group stage match', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 400 when predicting penalties without tied scores', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Penalty Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Penalty Away Team' });

    const knockoutMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stadium: 'Penalty Stadium',
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.SEMI_FINAL,
      },
      homeTeam,
      awayTeam
    );

    const penaltyPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: knockoutMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .put(`/predictions/${penaltyPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 400 when predicting penalties without penalty scores', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'No Penalty Scores Home' });
    const awayTeam = await createTeam(teamsRepository, { name: 'No Penalty Scores Away' });

    const knockoutMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stadium: 'No Penalty Scores Stadium',
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.FINAL,
      },
      homeTeam,
      awayTeam
    );

    const noPenaltyScoresPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: knockoutMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .put(`/predictions/${noPenaltyScoresPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasPenalties: true,
        // Missing predictedPenaltyHomeScore and predictedPenaltyAwayScore
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).put(`/predictions/${prediction.id}`).send({
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    expect(response.statusCode).toEqual(401);
  });

  it('should handle invalid prediction ID parameter', async () => {
    const response = await request(app.server)
      .put('/predictions/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', `params/predictionId must match pattern "^[0-9]+$"`);
  });

  it('should return 400 when validation fails for negative scores', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: -1,
        predictedAwayScore: 2,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/predictedHomeScore must be >= 0');
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing predictedHomeScore and predictedAwayScore
      });

    expect(response.statusCode).toEqual(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
  });

  it('should handle zero prediction ID gracefully', async () => {
    const response = await request(app.server)
      .put('/predictions/0')
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not found');
  });

  it('should handle negative prediction ID gracefully', async () => {
    const response = await request(app.server)
      .put('/predictions/-1')
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain(`params/predictionId must match pattern "^[0-9]+$"`);
  });

  it('should return updated prediction with all expected properties', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 4,
        predictedAwayScore: 2,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdatePredictionResponse;
    expect(body.prediction).toHaveProperty('id');
    expect(body.prediction).toHaveProperty('userId');
    expect(body.prediction).toHaveProperty('poolId');
    expect(body.prediction).toHaveProperty('matchId');
    expect(body.prediction).toHaveProperty('predictedHomeScore');
    expect(body.prediction).toHaveProperty('predictedAwayScore');
    expect(body.prediction).toHaveProperty('predictedHasExtraTime');
    expect(body.prediction).toHaveProperty('predictedHasPenalties');
    expect(body.prediction).toHaveProperty('updatedAt');
    expect(body.prediction.updatedAt).not.toBeNull();
  });

  it('should return 422 when validation fails for non-numeric scores', async () => {
    const response = await request(app.server)
      .put(`/predictions/${prediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 'invalid',
        predictedAwayScore: 2,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/predictedHomeScore must be number');
  });

  it('should return 422 when validation fails for negative penalty scores', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Negative Penalty Home' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Negative Penalty Away' });

    const knockoutMatch = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stadium: 'Negative Penalty Stadium',
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.FINAL,
      },
      homeTeam,
      awayTeam
    );

    const negativePenaltyPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: knockoutMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .put(`/predictions/${negativePenaltyPrediction.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: -1,
        predictedPenaltyAwayScore: 3,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'body/predictedPenaltyHomeScore must be >= 0');
  });
});
