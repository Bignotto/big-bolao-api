import { MatchStage, MatchStatus } from '@prisma/client';
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

type PredictionEntry = {
  poolId: number;
  poolName: string;
  matchId: number;
  prediction: {
    id: number;
    predictedHomeScore: number;
    predictedAwayScore: number;
    predictedHasExtraTime: boolean;
    predictedHasPenalties: boolean;
    predictedPenaltyHomeScore: number | null;
    predictedPenaltyAwayScore: number | null;
    pointsEarned: number | null;
    submittedAt: string;
    updatedAt: string | null;
  } | null;
};

type GetMyMatchPredictionsResponse = {
  predictions: PredictionEntry[];
};

type ErrorResponse = {
  message: string;
};

describe('Get My Match Predictions Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;
  let predictionsRepository: IPredictionsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();
    predictionsRepository = new PrismaPredictionsRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/matches/1/predictions/me');

    expect(response.statusCode).toEqual(401);
  });

  it('should return 404 when match does not exist', async () => {
    const response = await request(app.server)
      .get('/matches/999999/predictions/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Match not found');
  });

  it('should return empty predictions array when user belongs to no pools for the tournament', async () => {
    const homeTeam = await createTeam(teamsRepository, { name: 'Team A Empty' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B Empty' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    expect(body.predictions).toEqual([]);
  });

  it('should return one entry per pool with prediction: null when no prediction was submitted', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Team A NoPred' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B NoPred' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Pool No Prediction',
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    expect(body.predictions).toHaveLength(1);
    expect(body.predictions[0].poolId).toBe(pool.id);
    expect(body.predictions[0].poolName).toBe('Pool No Prediction');
    expect(body.predictions[0].matchId).toBe(match.id);
    expect(body.predictions[0].prediction).toBeNull();
  });

  it('should return the prediction when one was submitted', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Team A WithPred' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B WithPred' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Pool With Prediction',
    });

    await createPrediction(predictionsRepository, {
      userId,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    expect(body.predictions).toHaveLength(1);

    const entry = body.predictions[0];
    expect(entry.poolId).toBe(pool.id);
    expect(entry.matchId).toBe(match.id);
    expect(entry.prediction).not.toBeNull();
    expect(entry.prediction?.predictedHomeScore).toBe(2);
    expect(entry.prediction?.predictedAwayScore).toBe(1);
    expect(entry.prediction?.predictedHasExtraTime).toBe(false);
    expect(entry.prediction?.predictedHasPenalties).toBe(false);
    expect(entry.prediction?.pointsEarned).toBeNull();
    expect(entry.prediction?.submittedAt).toBeDefined();
  });

  it('should return one entry per pool mixing predictions and nulls', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Team A Mix' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B Mix' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    const poolWithPrediction = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Pool Mix A',
    });

    const poolWithoutPrediction = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: 'Pool Mix B',
    });

    await createPrediction(predictionsRepository, {
      userId,
      matchId: match.id,
      poolId: poolWithPrediction.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    expect(body.predictions).toHaveLength(2);

    const entryA = body.predictions.find((p) => p.poolId === poolWithPrediction.id);
    const entryB = body.predictions.find((p) => p.poolId === poolWithoutPrediction.id);

    expect(entryA?.prediction).not.toBeNull();
    expect(entryA?.prediction?.predictedHomeScore).toBe(3);
    expect(entryB?.prediction).toBeNull();
  });

  it('should not include pools from a different tournament', async () => {
    const otherTournament = await createTournament(tournamentsRepository, {});

    const homeTeam = await createTeam(teamsRepository, { name: 'Team A OtherTournament' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B OtherTournament' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    // Pool belongs to a different tournament
    await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: otherTournament.id,
      name: 'Pool Other Tournament',
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    // The pool from a different tournament should not appear
    const hasOtherTournamentPool = body.predictions.some(
      (p) => p.poolName === 'Pool Other Tournament'
    );
    expect(hasOtherTournamentPool).toBe(false);
  });

  it('should not include pools where the user is not a participant', async () => {
    const otherUser = await createUser(usersRepository, {
      email: 'other-user-mypreds@example.com',
    });

    const homeTeam = await createTeam(teamsRepository, { name: 'Team A NotPart' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Team B NotPart' });
    const match = await createMatch(
      matchesRepository,
      { tournamentId, matchStatus: MatchStatus.SCHEDULED, matchStage: MatchStage.GROUP },
      homeTeam,
      awayTeam
    );

    // Pool created by another user; authenticated user is not a participant
    await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId,
      name: 'Pool Not Participant',
    });

    const response = await request(app.server)
      .get(`/matches/${match.id}/predictions/me`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMyMatchPredictionsResponse;
    const hasOtherPool = body.predictions.some((p) => p.poolName === 'Pool Not Participant');
    expect(hasOtherPool).toBe(false);
  });
});
