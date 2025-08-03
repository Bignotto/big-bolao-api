import { Match } from '@prisma/client';
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

type UpdateMatchResponse = {
  match: Match;
};

type ErrorResponse = {
  message: string;
};

describe('Update Match Controller (e2e)', () => {
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

  it('should be able to update a match', async () => {
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

    const updatedStadium = 'Updated Stadium';
    const updatedMatchDate = new Date();
    updatedMatchDate.setDate(updatedMatchDate.getDate() + 1); // Set to tomorrow

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stadium: updatedStadium,
        matchDate: updatedMatchDate.toISOString(),
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('match');

    const body = response.body as UpdateMatchResponse;
    expect(body.match).toHaveProperty('id', match.id);
    expect(body.match).toHaveProperty('stadium', updatedStadium);

    const updatedMatch = await matchesRepository.findById(match.id);
    expect(updatedMatch).not.toBeNull();
    expect(updatedMatch?.stadium).toEqual(updatedStadium);
  });

  it('should be able to update match scores', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const { match } = await createMatchWithTeams(
      {
        matchesRepository,
        teamsRepository,
      },
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Another Test Stadium',
        matchStatus: 'IN_PROGRESS',
        matchStage: 'GROUP',
      }
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 2,
        awayTeamScore: 1,
        matchStatus: 'COMPLETED',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('match');

    const body = response.body as UpdateMatchResponse;
    expect(body.match).toHaveProperty('id', match.id);
    expect(body.match).toHaveProperty('homeTeamScore', 2);
    expect(body.match).toHaveProperty('awayTeamScore', 1);
    expect(body.match).toHaveProperty('matchStatus', 'COMPLETED');
  });

  it('should not allow setting scores for a scheduled match', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 3' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 3' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 3',
        matchStatus: 'SCHEDULED',
        matchStage: 'GROUP',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 2,
        awayTeamScore: 1,
      });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty('message');
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Cannot set score');
  });

  it('should be able to update a knockout match with extra time', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 4' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 4' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 4',
        matchStatus: 'IN_PROGRESS',
        matchStage: 'SEMI_FINAL',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 1,
        awayTeamScore: 1,
        hasExtraTime: true,
        matchStatus: 'COMPLETED',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('match');
    const body = response.body as UpdateMatchResponse;
    expect(body.match).toHaveProperty('id', match.id);
    expect(body.match).toHaveProperty('hasExtraTime', true);
  });

  it('should be able to update a knockout match with penalties', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 5' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 5' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 5',
        matchStatus: 'IN_PROGRESS',
        matchStage: 'FINAL',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 2,
        awayTeamScore: 2,
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 4,
        matchStatus: 'COMPLETED',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('match');
    const body = response.body as UpdateMatchResponse;
    expect(body.match).toHaveProperty('id', match.id);
    expect(body.match).toHaveProperty('hasExtraTime', true);
    expect(body.match).toHaveProperty('hasPenalties', true);
    expect(body.match).toHaveProperty('penaltyHomeScore', 5);
    expect(body.match).toHaveProperty('penaltyAwayScore', 4);
  });

  it('should not allow penalties without extra time', async () => {
    // Create test data
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 6' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 6' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 6',
        matchStatus: 'IN_PROGRESS',
        matchStage: 'FINAL',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 2,
        awayTeamScore: 2,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 4,
      });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty('message');
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Penalties can only be set when extra time is set');
  });

  it('should not allow penalties with different scores', async () => {
    // Create test data
    const tournament = await createTournament(tournamentsRepository, {});
    const homeTeam = await createTeam(teamsRepository, { name: 'Home Team 7' });
    const awayTeam = await createTeam(teamsRepository, { name: 'Away Team 7' });

    const match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date(),
        stadium: 'Test Stadium 7',
        matchStatus: 'IN_PROGRESS',
        matchStage: 'FINAL',
      },
      homeTeam,
      awayTeam
    );

    const response = await request(app.server)
      .put(`/matches/${match.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        homeTeamScore: 2,
        awayTeamScore: 1, // Different score
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 4,
      });

    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty('message');
    const body = response.body as ErrorResponse;
    expect(body.message).toContain('Penalties can only occur when scores are tied');
  });

  it('should return 404 when match does not exist', async () => {
    const nonExistentMatchId = 9999;

    const response = await request(app.server)
      .put(`/matches/${nonExistentMatchId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stadium: 'Updated Stadium',
      });

    expect(response.statusCode).toEqual(404);
    const body = response.body as ErrorResponse;
    expect(body.message).toEqual('Resource not found: Match not found');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).put('/matches/1').send({
      stadium: 'Updated Stadium',
    });

    expect(response.statusCode).toEqual(401);
  });
});
