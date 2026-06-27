import { MatchStatus } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { PrismaTeamsRepository } from '@/repositories/teams/PrismaTeamsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { closeTestApp, createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatch } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';

type FormResultEntry = {
  matchId: number;
  result: 'W' | 'D' | 'L';
  teamScore: number;
  opponentScore: number;
  opponentId: number;
  opponentName: string;
  opponentCode: string | null;
  matchDatetime: string;
  stage: string;
  decidedOnPenalties: boolean;
};

type RecentFormBody = {
  teamId: number;
  results: FormResultEntry[];
};

describe('Get Team Recent Form Controller (e2e)', () => {
  let app: FastifyInstance;
  let token: string;

  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await getSupabaseAccessToken(app));
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/teams/1/recent-form').send();

    expect(response.statusCode).toEqual(401);
  });

  it('should return empty results for a team with no completed matches', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Team No Results' });
    const teamB = await createTeam(teamsRepository, { name: 'Team B' });

    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED },
      teamA,
      teamB
    );

    const response = await request(app.server)
      .get(`/teams/${teamA.id}/recent-form`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(body).toHaveProperty('teamId', teamA.id);
    expect(body.results).toHaveLength(0);
  });

  it('should return W for a home win from the home team perspective', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Home Winner', countryCode: 'BRA' });
    const teamB = await createTeam(teamsRepository, { name: 'Away Loser', countryCode: 'ARG' });

    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        homeTeamScore: 3,
        awayTeamScore: 1,
        matchStatus: MatchStatus.COMPLETED,
      },
      teamA,
      teamB
    );

    const response = await request(app.server)
      .get(`/teams/${teamA.id}/recent-form`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].result).toBe('W');
    expect(body.results[0].teamScore).toBe(3);
    expect(body.results[0].opponentScore).toBe(1);
    expect(body.results[0].opponentId).toBe(teamB.id);
    expect(body.results[0].opponentName).toBe(teamB.name);
    expect(body.results[0].opponentCode).toBe('ARG');
  });

  it('should return L for the same match from the away team perspective', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Home Side POV' });
    const teamB = await createTeam(teamsRepository, { name: 'Away Side POV' });

    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        homeTeamScore: 3,
        awayTeamScore: 1,
        matchStatus: MatchStatus.COMPLETED,
      },
      teamA,
      teamB
    );

    const response = await request(app.server)
      .get(`/teams/${teamB.id}/recent-form`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(body.results[0].result).toBe('L');
    expect(body.results[0].teamScore).toBe(1);
    expect(body.results[0].opponentScore).toBe(3);
  });

  it('should return D and set decidedOnPenalties when match had penalties', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Penalty Team A' });
    const teamB = await createTeam(teamsRepository, { name: 'Penalty Team B' });

    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        homeTeamScore: 1,
        awayTeamScore: 1,
        matchStatus: MatchStatus.COMPLETED,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 4,
      },
      teamA,
      teamB
    );

    const response = await request(app.server)
      .get(`/teams/${teamA.id}/recent-form`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(body.results[0].result).toBe('D');
    expect(body.results[0].decidedOnPenalties).toBe(true);
  });

  it('should respect the limit query parameter', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Limited Team' });
    const teamB = await createTeam(teamsRepository, { name: 'Opponent Limited' });

    for (let i = 0; i < 5; i++) {
      await createMatch(
        matchesRepository,
        {
          tournamentId: tournament.id,
          matchDatetime: new Date(`2026-06-${String(i + 1).padStart(2, '0')}T15:00:00Z`),
          homeTeamScore: 1,
          awayTeamScore: 0,
          matchStatus: MatchStatus.COMPLETED,
        },
        teamA,
        teamB
      );
    }

    const response = await request(app.server)
      .get(`/teams/${teamA.id}/recent-form?limit=2`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(body.results).toHaveLength(2);
  });

  it('should return results ordered oldest to newest', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const teamA = await createTeam(teamsRepository, { name: 'Order Team A' });
    const teamB = await createTeam(teamsRepository, { name: 'Order Team B' });

    const dates = [
      new Date('2026-07-20T15:00:00Z'),
      new Date('2026-07-10T15:00:00Z'),
      new Date('2026-07-15T15:00:00Z'),
    ];

    for (const matchDatetime of dates) {
      await createMatch(
        matchesRepository,
        {
          tournamentId: tournament.id,
          matchDatetime,
          homeTeamScore: 1,
          awayTeamScore: 0,
          matchStatus: MatchStatus.COMPLETED,
        },
        teamA,
        teamB
      );
    }

    const response = await request(app.server)
      .get(`/teams/${teamA.id}/recent-form?limit=3`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const body = response.body as unknown as RecentFormBody;
    expect(response.statusCode).toEqual(200);
    expect(new Date(body.results[0].matchDatetime).getTime()).toBeLessThan(
      new Date(body.results[1].matchDatetime).getTime()
    );
    expect(new Date(body.results[1].matchDatetime).getTime()).toBeLessThan(
      new Date(body.results[2].matchDatetime).getTime()
    );
  });
});
