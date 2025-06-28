import { createServer } from '@/app';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatch } from '@/test/mocks/match';
import { createTournament } from '@/test/mocks/tournament';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Tournaments E2E', async () => {
  const app = await createServer();
  let token: string;
  let tournamentId: number;

  let tournamentsRepository: ITournamentsRepository;
  let matchesRepository: IMatchesRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token } = await getSupabaseAccessToken(app));
    tournamentsRepository = new PrismaTournamentsRepository();
    matchesRepository = new PrismaMatchesRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    // Create matches for the tournament
    for (let i = 1; i <= 3; i++) {
      await createMatch(matchesRepository, { tournamentId });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /tournaments', () => {
    it('should be able to list all tournaments', async () => {
      const response = await request(app.server)
        .get('/tournaments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.tournaments).toBeInstanceOf(Array);
      expect(response.body.tournaments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /tournaments/:tournamentId/matches', () => {
    it('should be able to get matches for a tournament', async () => {
      const response = await request(app.server)
        .get(`/tournaments/${tournamentId}/matches`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.matches).toBeInstanceOf(Array);
      expect(response.body.matches.length).toBe(3);
    });
  });
});
