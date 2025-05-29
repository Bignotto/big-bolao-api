import { createServer } from '@/app';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { PrismaTeamsRepository } from '@/repositories/teams/PrismaTeamsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Match Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;

  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });

  afterAll(async () => {
    await app.close();
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
    expect(response.body).toHaveProperty('match');
    expect(response.body.match).toHaveProperty('id', match.id);
    expect(response.body.match).toHaveProperty('homeTeam');
    expect(response.body.match).toHaveProperty('awayTeam');
    expect(response.body.match).toHaveProperty('tournament');
    expect(response.body.match.homeTeam.id).toEqual(homeTeam.id);
    expect(response.body.match.awayTeam.id).toEqual(awayTeam.id);
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
    expect(response.body).toHaveProperty('match');
    expect(response.body.match).toHaveProperty('id', match.id);
    expect(response.body.match).toHaveProperty('homeTeam');
    expect(response.body.match).toHaveProperty('awayTeam');
    expect(response.body.match.homeTeam.id).toEqual(homeTeam.id);
    expect(response.body.match.awayTeam.id).toEqual(awayTeam.id);
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
