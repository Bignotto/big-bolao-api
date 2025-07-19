import { MatchStage, MatchStatus } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
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
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type CreatePredictionResponse = {
  prediction: {
    id: number;
    matchId: number;
    poolId: number;
    userId: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedHasExtraTime: boolean;
    predictedHasPenalties: boolean;
    predictedPenaltyHomeScore?: number;
    predictedPenaltyAwayScore?: number;
  };
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
};

describe('Create Prediction Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a prediction successfully', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Test Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.GROUP,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreatePredictionResponse;
    expect(body).toHaveProperty('prediction');
    expect(body.prediction).toEqual(
      expect.objectContaining({
        matchId: match.id,
        poolId: pool.id,
        userId: userId,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        predictedHasExtraTime: false,
        predictedHasPenalties: false,
      })
    );
  });

  it('should create a prediction with extra time and penalties for knockout matches', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Knockout Test Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team KO',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team KO',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.QUARTER_FINAL,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreatePredictionResponse;
    expect(body.prediction).toEqual(
      expect.objectContaining({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      })
    );
  });

  it('should return 404 when pool does not exist', async () => {
    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team 404',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team 404',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: nonExistentPoolId,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool not found');
  });

  it('should return 404 when match does not exist', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Match 404 Pool',
    });

    const nonExistentMatchId = 9999;

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: nonExistentMatchId,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Match not found');
  });

  it('should return 403 when user is not a participant in the pool', async () => {
    const otherUser = await createUser(usersRepository, {
      email: 'other-user@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId,
      name: 'Not Participant Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team 403',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team 403',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain(`Not participant: ${userId}`);
  });

  it('should return 400 when match is not scheduled', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Completed Match Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Completed',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Completed',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.COMPLETED,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain(`Invalid Match Status: ${match.matchStatus}`);
  });

  it('should return 409 when prediction already exists', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Duplicate Prediction Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Duplicate',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Duplicate',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    // Create first prediction
    await request(app.server).post('/predictions').set('Authorization', `Bearer ${token}`).send({
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Try to create duplicate prediction
    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      });

    expect(response.statusCode).toEqual(409);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('already exists');
  });

  it('should return 409 when trying to predict extra time for group stage match', async () => {
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Group Extra Time Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Group',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Group',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.GROUP,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
      });

    expect(response.statusCode).toEqual(409);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Non knockout matches cannot have extra time');
  });

  it('should return 409 when predicting penalties without tied scores', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Penalties Without Tie Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Penalties',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Penalties',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.QUARTER_FINAL,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 4,
        predictedPenaltyAwayScore: 3,
      });

    expect(response.statusCode).toEqual(409);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Penalties can only be predicted when scores are tied');
  });

  it('should return 409 when predicting penalties without penalty scores', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Penalties No Scores Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team No Penalty Scores',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team No Penalty Scores',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.SCHEDULED,
        matchStage: MatchStage.SEMI_FINAL,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasPenalties: true,
        // Missing predictedPenaltyHomeScore and predictedPenaltyAwayScore
      });

    expect(response.statusCode).toEqual(409);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Penalty scores must be provided when penalties are predicted');
  });

  it('should return 400 when validation fails for negative scores', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Negative Scores Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Negative',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Negative',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: -1,
        predictedAwayScore: 2,
      });

    expect(response.statusCode).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('body/predictedHomeScore must be >= 0');
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: 1,
        // Missing poolId, predictedHomeScore, predictedAwayScore
      });

    expect(response.statusCode).toEqual(400);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toBe(`body must have required property 'poolId'`);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).post('/predictions').send({
      matchId: 1,
      poolId: 1,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    expect(response.statusCode).toEqual(401);
  });

  it('should return 404 when match tournament does not match pool tournament', async () => {
    const tournament1 = await createTournament(tournamentsRepository, {
      name: 'Tournament 1',
    });

    const tournament2 = await createTournament(tournamentsRepository, {
      name: 'Tournament 2',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament1.id,
      name: 'Tournament Mismatch Pool',
    });

    const homeTeam = await createTeam(teamsRepository, {
      name: 'Home Team Mismatch',
    });

    const awayTeam = await createTeam(teamsRepository, {
      name: 'Away Team Mismatch',
    });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament2.id, // Different tournament
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .post('/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      });

    expect(response.statusCode).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Match not found in the pool');
  });
});
