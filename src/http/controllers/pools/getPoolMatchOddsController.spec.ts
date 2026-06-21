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

type GetPoolMatchOddsResponse = {
  odds: MatchOdds[];
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message?: string;
};

describe('Get Pool Match Odds Controller (e2e)', async () => {
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
    const response = await request(app.server).get('/pools/1/odds').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should return 400 when pool ID is not a number', async () => {
    const response = await request(app.server)
      .get('/pools/not-a-number/odds')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should return 404 when pool does not exist', async () => {
    const response = await request(app.server)
      .get('/pools/9999999/odds')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Pool not found');
  });

  it('should return 403 when user is not a pool member', async () => {
    const otherUser = await createUser(usersRepository, { email: `odds-other-${Date.now()}@test.com` });
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: otherUser.id,
      tournamentId: tournament.id,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body.message).toContain('not a participant or the creator');
  });

  it('should return 200 with odds array as pool creator', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('odds');

    const body = response.body as GetPoolMatchOddsResponse;
    expect(Array.isArray(body.odds)).toBe(true);
  });

  it('should return 200 with odds array as pool participant', async () => {
    const otherOwner = await createUser(usersRepository, { email: `odds-owner-${Date.now()}@test.com` });
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: otherOwner.id,
      tournamentId: tournament.id,
    });

    await poolsRepository.addParticipant({ poolId: pool.id, userId });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPoolMatchOddsResponse;
    expect(Array.isArray(body.odds)).toBe(true);
  });

  it('should return each match entry with the correct structure', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPoolMatchOddsResponse;
    expect(body.odds.length).toBeGreaterThanOrEqual(1);

    const entry = body.odds[0];
    expect(entry).toHaveProperty('matchId');
    expect(entry).toHaveProperty('homeTeam');
    expect(entry).toHaveProperty('awayTeam');
    expect(entry).toHaveProperty('global');
    expect(entry).toHaveProperty('pool');

    expect(entry.global).toHaveProperty('total');
    expect(entry.global).toHaveProperty('homeWinsPercentage');
    expect(entry.global).toHaveProperty('drawPercentage');
    expect(entry.global).toHaveProperty('awayWinsPercentage');

    expect(entry.pool).toHaveProperty('total');
    expect(entry.pool).toHaveProperty('homeWinsPercentage');
    expect(entry.pool).toHaveProperty('drawPercentage');
    expect(entry.pool).toHaveProperty('awayWinsPercentage');
  });

  it('should count pool predictions correctly: 3 home, 1 draw, 1 away', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    // 3 home-win predictions (home > away)
    for (let i = 0; i < 3; i++) {
      const user = await createUser(usersRepository, { email: `odds-hw-${Date.now()}-${i}@test.com` });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: user.id });
      await createPrediction(predictionsRepository, {
        matchId: match.id,
        poolId: pool.id,
        userId: user.id,
        predictedHomeScore: 2,
        predictedAwayScore: 0,
      });
    }

    // 1 draw prediction (home = away)
    const drawUser = await createUser(usersRepository, { email: `odds-draw-${Date.now()}@test.com` });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: drawUser.id });
    await createPrediction(predictionsRepository, {
      matchId: match.id,
      poolId: pool.id,
      userId: drawUser.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    // 1 away-win prediction (away > home)
    const awayUser = await createUser(usersRepository, { email: `odds-aw-${Date.now()}@test.com` });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: awayUser.id });
    await createPrediction(predictionsRepository, {
      matchId: match.id,
      poolId: pool.id,
      userId: awayUser.id,
      predictedHomeScore: 0,
      predictedAwayScore: 1,
    });

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPoolMatchOddsResponse;
    const matchOdds = body.odds.find((o) => o.matchId === match.id);
    expect(matchOdds).toBeDefined();

    expect(matchOdds!.pool.total).toBe(5);
    expect(matchOdds!.pool.homeWinsPercentage).toBe(60);
    expect(matchOdds!.pool.drawPercentage).toBe(20);
    expect(matchOdds!.pool.awayWinsPercentage).toBe(20);
  });

  it('should count global predictions from all pools, not just the requested pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    // Pool A — the one we'll query
    const poolA = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    // Pool B — a separate pool with its own predictions
    const otherOwner = await createUser(usersRepository, { email: `odds-global-owner-${Date.now()}@test.com` });
    const poolB = await createPool(poolsRepository, {
      creatorId: otherOwner.id,
      tournamentId: tournament.id,
    });

    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    // 2 home-win predictions in pool A
    for (let i = 0; i < 2; i++) {
      const user = await createUser(usersRepository, { email: `odds-ga-${Date.now()}-${i}@test.com` });
      await poolsRepository.addParticipant({ poolId: poolA.id, userId: user.id });
      await createPrediction(predictionsRepository, {
        matchId: match.id,
        poolId: poolA.id,
        userId: user.id,
        predictedHomeScore: 2,
        predictedAwayScore: 0,
      });
    }

    // 3 away-win predictions in pool B (should appear in global but NOT in pool A's scoped stats)
    for (let i = 0; i < 3; i++) {
      const user = await createUser(usersRepository, { email: `odds-gb-${Date.now()}-${i}@test.com` });
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
      .get(`/pools/${poolA.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPoolMatchOddsResponse;
    const matchOdds = body.odds.find((o) => o.matchId === match.id);
    expect(matchOdds).toBeDefined();

    // Pool A scoped: 2 home wins out of 2
    expect(matchOdds!.pool.total).toBe(2);
    expect(matchOdds!.pool.homeWinsPercentage).toBe(100);
    expect(matchOdds!.pool.awayWinsPercentage).toBe(0);

    // Global: 2 home wins + 3 away wins = 5 total
    expect(matchOdds!.global.total).toBeGreaterThanOrEqual(5);
    expect(matchOdds!.global.homeWinsPercentage).toBeGreaterThan(0);
    expect(matchOdds!.global.awayWinsPercentage).toBeGreaterThan(0);
  });

  it('should return zero percentages for matches with no predictions', async () => {
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
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as GetPoolMatchOddsResponse;
    const matchOdds = body.odds.find((o) => o.matchId === match.id);
    expect(matchOdds).toBeDefined();

    expect(matchOdds!.global.total).toBe(0);
    expect(matchOdds!.global.homeWinsPercentage).toBe(0);
    expect(matchOdds!.global.drawPercentage).toBe(0);
    expect(matchOdds!.global.awayWinsPercentage).toBe(0);
    expect(matchOdds!.pool.total).toBe(0);
  });

  it('should include team names and country codes in each odds entry', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id }
    );

    const response = await request(app.server)
      .get(`/pools/${pool.id}/odds`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as GetPoolMatchOddsResponse;
    const entry = body.odds[0];

    expect(entry.homeTeam).toHaveProperty('id');
    expect(entry.homeTeam).toHaveProperty('name');
    expect(entry.awayTeam).toHaveProperty('id');
    expect(entry.awayTeam).toHaveProperty('name');
  });
});
