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
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';

describe('Get Match Controller (e2e)', () => {
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

  it('should be able to get a match by id', async () => {
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

    const response = await request(app.server)
      .get(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    type MatchResponse = {
      match: {
        id: number;
        homeTeam: { id: number };
        awayTeam: { id: number };
        tournament?: unknown;
      };
    };
    const body = response.body as unknown as MatchResponse;
    expect(body).toHaveProperty('match');
    expect(body.match).toHaveProperty('id', match.id);
    expect(body.match).toHaveProperty('homeTeam');
    expect(body.match).toHaveProperty('awayTeam');
    expect(body.match).toHaveProperty('tournament');
    expect(body.match.homeTeam.id).toEqual(homeTeam.id);
    expect(body.match.awayTeam.id).toEqual(awayTeam.id);
  });

  it('should be able to get a match with teams in a single call', async () => {
    // Create test data using the createMatchWithTeams helper
    const tournament = await createTournament(tournamentsRepository, {});

    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      {
        matchesRepository,
        teamsRepository,
      },
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Another Test Stadium',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      }
    );

    const response = await request(app.server)
      .get(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    type MatchResponse2 = {
      match: {
        id: number;
        homeTeam: { id: number };
        awayTeam: { id: number };
      };
    };
    const body2 = response.body as unknown as MatchResponse2;
    expect(body2).toHaveProperty('match');
    expect(body2.match).toHaveProperty('id', match.id);
    expect(body2.match).toHaveProperty('homeTeam');
    expect(body2.match).toHaveProperty('awayTeam');
    expect(body2.match.homeTeam.id).toEqual(homeTeam.id);
    expect(body2.match.awayTeam.id).toEqual(awayTeam.id);
  });

  it('should return 404 when match does not exist', async () => {
    const nonExistentMatchId = 9999;

    const response = await request(app.server)
      .get(`/matches/${nonExistentMatchId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message', 'Resource not found: Match not found');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/matches/1').send();

    expect(response.statusCode).toEqual(401);
  });
});
