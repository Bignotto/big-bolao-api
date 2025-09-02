import { Match } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { PrismaTeamsRepository } from '@/repositories/teams/PrismaTeamsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { createTestApp } from '@/test/helper-e2e';
import { createMatchWithTeams } from '@/test/mocks/match';
import { createTournament } from '@/test/mocks/tournament';

type TournamentMatchesResponse = {
  matches: Array<Match>;
};

describe('GET /tournaments/:tournamentId/matches', async () => {
  const app = await createTestApp();
  let token: string;
  let tournamentId: number;

  let tournamentsRepository: ITournamentsRepository;
  let matchesRepository: IMatchesRepository;
  let teamsRepository: ITeamsRepository;

  beforeAll(async () => {
    token = app.jwt.sign({ sub: 'test-user' });
    tournamentsRepository = new PrismaTournamentsRepository();
    matchesRepository = new PrismaMatchesRepository();
    teamsRepository = new PrismaTeamsRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    for (let i = 1; i <= 3; i++) {
      await createMatchWithTeams({ matchesRepository, teamsRepository }, { tournamentId });
    }
  });

  it('should be able to get matches for a tournament', async () => {
    const response = await request(app.server)
      .get(`/tournaments/${tournamentId}/matches`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const body = response.body as TournamentMatchesResponse;
    expect(body.matches).toBeInstanceOf(Array);
    expect(body.matches.length).toBe(3);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get(
      `/tournaments/${tournamentId}/matches`
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent tournament', async () => {
    const response = await request(app.server)
      .get(`/tournaments/999999/matches`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 422 when query params are invalid', async () => {
    const response = await request(app.server)
      .get(`/tournaments/${tournamentId}/matches`)
      .query({ limit: 0 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(422);
  });
});

