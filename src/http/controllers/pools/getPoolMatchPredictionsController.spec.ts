import { Match, Pool, Prediction, User } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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

type PoolMatchPredictionResponse = {
  predictions: Array<{
    participant: {
      id: string;
      fullName: string;
      profileImageUrl: string | null;
      joinedAt: string;
      isOwner: boolean;
    };
    predictionSubmitted: boolean;
    prediction: Prediction | null;
  }>;
};

describe('Get Pool Match Predictions Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;

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
  });

  it('should return scheduled match rows while hiding other participants predictions', async () => {
    const { pool, match, otherParticipant, emptyParticipant, requesterPrediction } =
      await createPoolMatchScenario('SCHEDULED');

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as PoolMatchPredictionResponse;
    const requesterRow = body.predictions.find((row) => row.participant.id === userId);
    const otherParticipantRow = body.predictions.find(
      (row) => row.participant.id === otherParticipant.id
    );
    const emptyParticipantRow = body.predictions.find(
      (row) => row.participant.id === emptyParticipant.id
    );

    expect(body.predictions).toHaveLength(3);
    expect(requesterRow?.predictionSubmitted).toBe(true);
    expect(requesterRow?.prediction).toEqual(
      expect.objectContaining({
        id: requesterPrediction.id,
        userId,
      })
    );
    expect(otherParticipantRow?.predictionSubmitted).toBe(true);
    expect(otherParticipantRow?.prediction).toBeNull();
    expect(emptyParticipantRow?.predictionSubmitted).toBe(false);
    expect(emptyParticipantRow?.prediction).toBeNull();
  });

  it('should return all prediction details for non-scheduled matches', async () => {
    const { pool, match, otherParticipant, otherPrediction } =
      await createPoolMatchScenario('COMPLETED');

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as PoolMatchPredictionResponse;
    const otherParticipantRow = body.predictions.find(
      (row) => row.participant.id === otherParticipant.id
    );

    expect(otherParticipantRow?.predictionSubmitted).toBe(true);
    expect(otherParticipantRow?.prediction).toEqual(
      expect.objectContaining({
        id: otherPrediction.id,
        userId: otherParticipant.id,
      })
    );
  });

  it('should return 403 when user is not a pool participant', async () => {
    const otherUser = await createUser(usersRepository, uniqueUser('outside'));
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
      name: uniqueName('outside-pool'),
    });
    const match = await createMatchForTournament(tournament.id, 'COMPLETED');

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 when pool does not exist', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const match = await createMatchForTournament(tournament.id, 'COMPLETED');

    const response = await request(app.server)
      .get(`/pools/999999/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 when match does not exist', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: uniqueName('missing-match-pool'),
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/999999/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 when match is outside the pool tournament', async () => {
    const poolTournament = await createTournament(tournamentsRepository, {});
    const matchTournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: poolTournament.id,
      name: uniqueName('wrong-tournament-pool'),
    });
    const match = await createMatchForTournament(matchTournament.id, 'COMPLETED');

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/pools/1/matches/1/predictions').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should handle invalid route params', async () => {
    const response = await request(app.server)
      .get('/pools/invalid/matches/1/predictions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
  });

  async function createPoolMatchScenario(matchStatus: 'SCHEDULED' | 'COMPLETED'): Promise<{
    pool: Pool;
    match: Match;
    otherParticipant: User;
    emptyParticipant: User;
    requesterPrediction: Prediction;
    otherPrediction: Prediction;
  }> {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      name: uniqueName(`pool-${matchStatus}`),
    });
    const otherParticipant = await createUser(usersRepository, uniqueUser(`other-${matchStatus}`));
    const emptyParticipant = await createUser(usersRepository, uniqueUser(`empty-${matchStatus}`));

    await poolsRepository.addParticipant({ poolId: pool.id, userId: otherParticipant.id });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: emptyParticipant.id });

    const match = await createMatchForTournament(tournament.id, matchStatus);

    const requesterPrediction = await createPrediction(predictionsRepository, {
      userId,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
    const otherPrediction = await createPrediction(predictionsRepository, {
      userId: otherParticipant.id,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    return {
      pool,
      match,
      otherParticipant,
      emptyParticipant,
      requesterPrediction,
      otherPrediction,
    };
  }

  async function createMatchForTournament(
    tournamentId: number,
    matchStatus: 'SCHEDULED' | 'COMPLETED'
  ): Promise<Match> {
    const homeTeam = await createTeam(teamsRepository, { name: uniqueName('home') });
    const awayTeam = await createTeam(teamsRepository, { name: uniqueName('away') });

    return createMatch(
      matchesRepository,
      {
        tournamentId,
        matchStatus,
        matchStage: 'GROUP',
        matchDatetime: new Date(),
      },
      homeTeam,
      awayTeam
    );
  }
});

function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueUser(prefix: string): {
  fullName: string;
  email: string;
} {
  const unique = uniqueName(prefix);

  return {
    fullName: unique,
    email: `${unique}@example.com`,
  };
}
