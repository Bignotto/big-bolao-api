import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { MatchOdds } from '@/global/types/matchOdds';
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
import { createMatchWithTeams } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type GetMatchOddsResponse = { odds: MatchOdds };
type ErrorResponse = { code?: string; error?: string; message?: string };

describe('Get Pool Match Odds By Match Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;

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
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/pools/1/matches/1/odds').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should return 400 when pool ID is not a number', async () => {
    const response = await request(app.server)
      .get('/pools/abc/matches/1/odds')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty('code', 'FST_ERR_VALIDATION');
  });

  it('should return 400 when match ID is not a number', async () => {
    const response = await request(app.server)
      .get('/pools/1/matches/abc/odds')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty('code', 'FST_ERR_VALIDATION');
  });

  it('should return 404 when pool does not exist', async () => {
    const response = await request(app.server)
      .get('/pools/9999999/matches/1/odds')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Pool not found');
  });

  it('should return 403 when user is not a pool member', async () => {
    const otherUser = await createUser(usersRepository, {
      email: `bymatch-other-${Date.now()}@test.com`,
    });
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/1/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('not a participant or the creator');
  });

  it('should return 404 when match does not belong to the pool tournament', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/9999999/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Match not found');
  });

  it('should return 200 with a single odds object for a valid match', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('odds');

    const body = response.body as GetMatchOddsResponse;
    expect(body.odds).toHaveProperty('matchId', match.id);
    expect(body.odds).toHaveProperty('homeTeam');
    expect(body.odds).toHaveProperty('awayTeam');
    expect(body.odds).toHaveProperty('global');
    expect(body.odds).toHaveProperty('pool');
  });

  it('should return a single object (not an array) for odds', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    const body = response.body as GetMatchOddsResponse;
    expect(Array.isArray(body.odds)).toBe(false);
    expect(typeof body.odds).toBe('object');
  });

  it('should count predictions correctly for the specific match', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    // 4 home-win predictions
    for (let i = 0; i < 4; i++) {
      const user = await createUser(usersRepository, {
        email: `bymatch-hw-${Date.now()}-${i}@test.com`,
      });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: user.id });
      await createPrediction(predictionsRepository, {
        matchId: match.id,
        poolId: pool.id,
        userId: user.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      });
    }

    // 1 draw prediction
    const drawUser = await createUser(usersRepository, {
      email: `bymatch-draw-${Date.now()}@test.com`,
    });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: drawUser.id });
    await createPrediction(predictionsRepository, {
      matchId: match.id,
      poolId: pool.id,
      userId: drawUser.id,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMatchOddsResponse;
    expect(body.odds.pool.total).toBe(5);
    expect(body.odds.pool.homeWinsPercentage).toBe(80);
    expect(body.odds.pool.drawPercentage).toBe(20);
    expect(body.odds.pool.awayWinsPercentage).toBe(0);
  });

  it('should return zero percentages for a match with no predictions', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/matches/${match.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as GetMatchOddsResponse;
    expect(body.odds.global.total).toBe(0);
    expect(body.odds.global.homeWinsPercentage).toBe(0);
    expect(body.odds.pool.total).toBe(0);
  });

  it('should show global predictions from other pools but not in pool-scoped stats', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const poolA = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const otherOwner = await createUser(usersRepository, {
      email: `bymatch-global-${Date.now()}@test.com`,
    });
    const poolB = await createPool(poolsRepository, {
      creatorId: otherOwner.id,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    // 1 home-win in pool A
    const userA = await createUser(usersRepository, {
      email: `bymatch-ua-${Date.now()}@test.com`,
    });
    await poolsRepository.addParticipant({ poolId: poolA.id, userId: userA.id });
    await createPrediction(predictionsRepository, {
      matchId: match.id,
      poolId: poolA.id,
      userId: userA.id,
      predictedHomeScore: 2,
      predictedAwayScore: 0,
    });

    // 2 away-wins in pool B
    for (let i = 0; i < 2; i++) {
      const user = await createUser(usersRepository, {
        email: `bymatch-ub-${Date.now()}-${i}@test.com`,
      });
      await poolsRepository.addParticipant({ poolId: poolB.id, userId: user.id });
      await createPrediction(predictionsRepository, {
        matchId: match.id,
        poolId: poolB.id,
        userId: user.id,
        predictedHomeScore: 0,
        predictedAwayScore: 2,
      });
    }

    const response = await request(app.server)
      .get(`/pools/${poolA.id}/matches/${match.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetMatchOddsResponse;

    // Pool A: 1 home win only
    expect(body.odds.pool.total).toBe(1);
    expect(body.odds.pool.homeWinsPercentage).toBe(100);
    expect(body.odds.pool.awayWinsPercentage).toBe(0);

    // Global: 1 home + 2 away = 3 total (at minimum from this test's data)
    expect(body.odds.global.total).toBeGreaterThanOrEqual(3);
    expect(body.odds.global.awayWinsPercentage).toBeGreaterThan(0);
  });
});
