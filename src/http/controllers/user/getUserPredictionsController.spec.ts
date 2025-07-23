import { Match, Pool, Tournament } from '@prisma/client';
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

type GetUserPredictionsResponse = {
  predictions: Array<{
    id: string;
    userId: string;
    poolId: number;
    matchId: number;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedHasExtraTime: boolean;
    predictedHasPenalties: boolean;
    predictedPenaltyHomeScore?: number;
    predictedPenaltyAwayScore?: number;
    submittedAt: string;
    updatedAt?: string;
    pointsEarned?: number;
  }>;
};

type ErrorResponse = {
  message: string;
  issues?: unknown;
};

describe('Get User Predictions Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournament: Tournament;
  let pool: Pool;
  let match1: Match;
  let match2: Match;

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

    // Create test data
    tournament = await createTournament(tournamentsRepository, {});

    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const homeTeam1 = await createTeam(teamsRepository, { name: 'Home Team 1' });
    const awayTeam1 = await createTeam(teamsRepository, { name: 'Away Team 1' });
    const homeTeam2 = await createTeam(teamsRepository, { name: 'Home Team 2' });
    const awayTeam2 = await createTeam(teamsRepository, { name: 'Away Team 2' });

    match1 = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Stadium 1',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam1,
      awayTeam1
    );

    match2 = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Stadium 2',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam2,
      awayTeam2
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return an empty array when user has no predictions', async () => {
    const response = await request(app.server)
      .get('/users/me/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody).toHaveProperty('predictions');
    expect(Array.isArray(responseBody.predictions)).toBe(true);
    expect(responseBody.predictions).toHaveLength(0);
  });

  it('should return all user predictions when no poolId is specified', async () => {
    // Create predictions for the user
    const prediction1 = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: match1.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const prediction2 = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: match2.id,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    });

    const response = await request(app.server)
      .get('/users/me/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody).toHaveProperty('predictions');
    expect(Array.isArray(responseBody.predictions)).toBe(true);
    expect(responseBody.predictions).toHaveLength(2);

    const predictionIds = responseBody.predictions.map((p) => parseInt(p.id));
    expect(predictionIds).toContain(prediction1.id);
    expect(predictionIds).toContain(prediction2.id);
  });

  it('should return predictions filtered by poolId when specified', async () => {
    // Create another pool and prediction
    const anotherPool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
      name: 'Another Pool',
    });

    const prediction3 = await createPrediction(predictionsRepository, {
      userId,
      poolId: anotherPool.id,
      matchId: match1.id,
      predictedHomeScore: 3,
      predictedAwayScore: 2,
    });

    const response = await request(app.server)
      .get(`/users/me/predictions?poolId=${anotherPool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody).toHaveProperty('predictions');
    expect(Array.isArray(responseBody.predictions)).toBe(true);
    expect(responseBody.predictions).toHaveLength(1);
    expect(parseInt(responseBody.predictions[0].id)).toEqual(prediction3.id);
    expect(responseBody.predictions[0].poolId).toEqual(anotherPool.id);
  });

  it('should return 404 when specified pool does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .get(`/users/me/predictions?poolId=${nonExistentPoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const responseBody = response.body as ErrorResponse;
    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toContain('Pool not found');
  });

  it('should return 403 when user is not a participant in the specified pool', async () => {
    // Create another user and their pool
    const otherUser = await createUser(usersRepository, {
      email: 'other-user@example.com',
    });

    const otherUserPool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
      isPrivate: true,
      name: 'Other User Pool',
    });

    const response = await request(app.server)
      .get(`/users/me/predictions?poolId=${otherUserPool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);

    const responseBody = response.body as ErrorResponse;
    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toContain('User is not a participant in this pool');
  });

  it('should allow access when user is a participant but not creator', async () => {
    // Create another user and their pool
    const otherUser = await createUser(usersRepository, {
      email: 'pool-creator@example.com',
    });

    const participantPool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
      isPrivate: false,
      name: 'Participant Pool',
    });

    // Add the test user as a participant
    await poolsRepository.addParticipant({
      poolId: participantPool.id,
      userId,
    });

    // Create a prediction in this pool
    const participantPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: participantPool.id,
      matchId: match1.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/users/me/predictions?poolId=${participantPool.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody).toHaveProperty('predictions');
    expect(responseBody.predictions).toHaveLength(1);
    expect(parseInt(responseBody.predictions[0].id)).toEqual(participantPrediction.id);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/users/me/predictions').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle invalid poolId parameter', async () => {
    const response = await request(app.server)
      .get('/users/me/predictions?poolId=invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const responseBody = response.body as ErrorResponse;
    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toContain('must be number');
  });

  it('should return predictions with all expected properties', async () => {
    // First check if there are any existing predictions
    let response = await request(app.server)
      .get('/users/me/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    // If no predictions exist, create one for testing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (response.body.predictions.length === 0) {
      await createPrediction(predictionsRepository, {
        userId,
        poolId: pool.id,
        matchId: match2.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      });

      // Get predictions again
      response = await request(app.server)
        .get('/users/me/predictions')
        .set('Authorization', `Bearer ${token}`)
        .send();
    }

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody.predictions.length).toBeGreaterThan(0);

    const prediction = responseBody.predictions[0];
    expect(prediction).toHaveProperty('id');
    expect(prediction).toHaveProperty('userId');
    expect(prediction).toHaveProperty('poolId');
    expect(prediction).toHaveProperty('matchId');
    expect(prediction).toHaveProperty('predictedHomeScore');
    expect(prediction).toHaveProperty('predictedAwayScore');
    expect(prediction).toHaveProperty('predictedHasExtraTime');
    expect(prediction).toHaveProperty('predictedHasPenalties');
    expect(prediction).toHaveProperty('submittedAt');
  });

  it('should return consistent response structure', async () => {
    const response = await request(app.server)
      .get('/users/me/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const responseBody = response.body as GetUserPredictionsResponse;
    expect(responseBody).toHaveProperty('predictions');
    expect(Array.isArray(responseBody.predictions)).toBe(true);
    expect(Object.keys(responseBody)).toEqual(['predictions']);
  });

  it('should handle negative poolId gracefully', async () => {
    const response = await request(app.server)
      .get('/users/me/predictions?poolId=-1')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const responseBody = response.body as ErrorResponse;
    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toContain('must be >= 1');
  });

  it('should handle zero poolId gracefully', async () => {
    const response = await request(app.server)
      .get('/users/me/predictions?poolId=0')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const responseBody = response.body as ErrorResponse;
    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toContain('must be >= 1');
  });
});
