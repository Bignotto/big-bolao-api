import { MatchStatus, Pool, Tournament } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { IPredictionsRepository, UserPredictionWithPoints } from '@/repositories/predictions/IPredictionsRepository';
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

describe('Get Pool User Predictions Controller (e2e)', async () => {
  const app = await createTestApp();

  let token: string;
  let userId: string;

  let poolsRepository: IPoolsRepository;
  let predictionsRepository: IPredictionsRepository;
  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let usersRepository: IUsersRepository;

  let pool: Pool;
  let tournament: Tournament;
  let targetUserId: string;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));

    poolsRepository = new PrismaPoolsRepository();
    predictionsRepository = new PrismaPredictionsRepository();
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    usersRepository = new PrismaUsersRepository();

    tournament = await createTournament(tournamentsRepository, { name: 'World Cup E2E' });

    pool = await createPool(poolsRepository, {
      tournamentId: tournament.id,
      creatorId: userId,
    });

    const targetUser = await createUser(usersRepository, {
      email: `target-${Date.now()}@test.com`,
    });
    targetUserId = targetUser.id;
    await poolsRepository.addParticipant({ poolId: pool.id, userId: targetUserId });

    const homeTeam = await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.COMPLETED,
        homeTeamScore: 2,
        awayTeamScore: 1,
      },
      homeTeam,
      awayTeam
    );

    await createPrediction(predictionsRepository, {
      userId: targetUserId,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
  });

  it('should return 200 with predictions for a pool member viewing another member', async () => {
    const response = await request(app.server)
      .get(`/pools/${pool.id}/users/${targetUserId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as { predictions: UserPredictionWithPoints[] };

    expect(response.statusCode).toEqual(200);
    expect(body.predictions).toBeInstanceOf(Array);
    expect(body.predictions).toHaveLength(1);

    const prediction = body.predictions[0];
    expect(prediction).toHaveProperty('predictionId');
    expect(prediction).toHaveProperty('pointsEarned');
    expect(prediction).toHaveProperty('exactScore');
    expect(prediction).toHaveProperty('correctWinner');
    expect(prediction.exactScore).toBe(true);
    expect(prediction.correctWinner).toBe(true);
    expect(prediction.match).toHaveProperty('homeTeam');
    expect(prediction.match).toHaveProperty('awayTeam');
    expect(prediction.match.status).toBe(MatchStatus.COMPLETED);
  });

  it('should return 200 when a member views their own predictions', async () => {
    const response = await request(app.server)
      .get(`/pools/${pool.id}/users/${userId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as { predictions: UserPredictionWithPoints[] };

    expect(response.statusCode).toEqual(200);
    expect(body.predictions).toBeInstanceOf(Array);
  });

  it('should return 403 when caller is not a pool member', async () => {
    const outsider = await createUser(usersRepository, {
      email: `outsider-${Date.now()}@test.com`,
    });
    const outsiderPool = await createPool(poolsRepository, {
      tournamentId: tournament.id,
      creatorId: outsider.id,
    });

    const response = await request(app.server)
      .get(`/pools/${outsiderPool.id}/users/${outsider.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 when pool does not exist', async () => {
    const response = await request(app.server)
      .get(`/pools/99999/users/${targetUserId}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 when targetUserId is not in the pool', async () => {
    const stranger = await createUser(usersRepository, {
      email: `stranger-${Date.now()}@test.com`,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/users/${stranger.id}/predictions`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .get(`/pools/${pool.id}/users/${targetUserId}/predictions`)
      .send();

    expect(response.statusCode).toEqual(401);
  });
});
