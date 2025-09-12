import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { predictionSchemas } from '@/http/schemas/prediction.schemas';
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

// Type the response using the existing schemas
type GetMatchPredictionsResponse = {
  predictions: Array<typeof predictionSchemas.Prediction>;
};

describe('Get Match Predictions Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;

  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let predictionsRepository: IPredictionsRepository;
  let poolsRepository: IPoolsRepository;
  let usersRepository: IUsersRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    predictionsRepository = new PrismaPredictionsRepository();
    poolsRepository = new PrismaPoolsRepository();
    usersRepository = new PrismaUsersRepository();
  });


  it('should be able to get predictions for a match', async () => {
    // Create test data
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam,
      awayTeam
    );

    // Create a pool and users for predictions
    const pool = await createPool(poolsRepository, {
      name: 'Test Pool',
      tournamentId: tournament.id,
      creatorId: userId,
    });

    const user1 = await createUser(usersRepository, {
      email: 'user1@test.com',
      fullName: 'User One',
    });

    const user2 = await createUser(usersRepository, {
      email: 'user2@test.com',
      fullName: 'User Two',
    });

    // Create predictions
    const prediction1 = await createPrediction(predictionsRepository, {
      userId: user1.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const prediction2 = await createPrediction(predictionsRepository, {
      userId: user2.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMatchPredictionsResponse;
    expect(body).toHaveProperty('predictions');
    expect(body.predictions).toHaveLength(2);
    expect(body.predictions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: prediction1.id,
          userId: user1.id,
          matchId: match.id,
          poolId: pool.id,
          predictedHomeScore: 2,
          predictedAwayScore: 1,
        }),
        expect.objectContaining({
          id: prediction2.id,
          userId: user2.id,
          matchId: match.id,
          poolId: pool.id,
          predictedHomeScore: 1,
          predictedAwayScore: 1,
        }),
      ])
    );
  });

  it('should return empty array when match has no predictions', async () => {
    // Create test data without predictions
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 2' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 2' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 2',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    const body = response.body as GetMatchPredictionsResponse;
    expect(body).toHaveProperty('predictions');
    expect(body.predictions).toHaveLength(0);
  });

  it('should return predictions for completed matches', async () => {
    // Create test data
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 3' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 3' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 3',
        matchStatus: 'COMPLETED',
        matchStage: 'GROUP',
        homeTeamScore: 2,
        awayTeamScore: 1,
      },
      homeTeam,
      awayTeam
    );

    const pool = await createPool(poolsRepository, {
      name: 'Test Pool 3',
      tournamentId: tournament.id,
      creatorId: userId,
    });

    const user = await createUser(usersRepository, {
      email: 'user3@test.com',
      fullName: 'User Three',
    });

    const prediction = await createPrediction(predictionsRepository, {
      userId: user.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMatchPredictionsResponse;
    expect(response.body).toHaveProperty('predictions');
    expect(body.predictions).toHaveLength(1);
    expect(body.predictions[0]).toEqual(
      expect.objectContaining({
        id: prediction.id,
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    );
  });

  it('should return 404 when match does not exist', async () => {
    const nonExistentMatchId = 9999;

    const response = await request(app.server)
      .get(`/matches/${nonExistentMatchId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message', 'Resource not found: Match not found');
  });

  it('should handle invalid match ID parameter', async () => {
    const invalidMatchId = 'invalid';

    const response = await request(app.server)
      .get(`/matches/${invalidMatchId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(response.statusCode).toEqual(400);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/matches/1/predictions').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle multiple predictions from different pools for the same match', async () => {
    // Create test data
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 4' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 4' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 4',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam,
      awayTeam
    );

    // Create two different pools
    const pool1 = await createPool(poolsRepository, {
      name: 'Test Pool 4A',
      tournamentId: tournament.id,
      creatorId: userId,
    });

    const pool2 = await createPool(poolsRepository, {
      name: 'Test Pool 4B',
      tournamentId: tournament.id,
      creatorId: userId,
    });

    const user = await createUser(usersRepository, {
      email: 'user4@test.com',
      fullName: 'User Four',
    });

    // Create predictions in both pools
    const prediction1 = await createPrediction(predictionsRepository, {
      userId: user.id,
      matchId: match.id,
      poolId: pool1.id,
      predictedHomeScore: 2,
      predictedAwayScore: 0,
    });

    const prediction2 = await createPrediction(predictionsRepository, {
      userId: user.id,
      matchId: match.id,
      poolId: pool2.id,
      predictedHomeScore: 1,
      predictedAwayScore: 2,
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMatchPredictionsResponse;
    expect(response.body).toHaveProperty('predictions');
    expect(body.predictions).toHaveLength(2);
    expect(body.predictions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: prediction1.id,
          poolId: pool1.id,
          predictedHomeScore: 2,
          predictedAwayScore: 0,
        }),
        expect.objectContaining({
          id: prediction2.id,
          poolId: pool2.id,
          predictedHomeScore: 1,
          predictedAwayScore: 2,
        }),
      ])
    );
  });
});
