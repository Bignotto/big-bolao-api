import { Tournament } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { createTestApp } from '@/test/helper-e2e';
import { createTournament } from '@/test/mocks/tournament';

type TournamentResponse = {
  tournaments: Array<Tournament>;
};

describe('GET /tournaments', async () => {
  const app = await createTestApp();
  let token: string;

  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    token = app.jwt.sign({ sub: 'test-user' });
    tournamentsRepository = new PrismaTournamentsRepository();

    await createTournament(tournamentsRepository, {});
  });

  it('should be able to list all tournaments', async () => {
    const response = await request(app.server)
      .get('/tournaments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const body = response.body as TournamentResponse;
    expect(body.tournaments).toBeInstanceOf(Array);
    expect(body.tournaments.length).toBeGreaterThanOrEqual(1);
  });

  it('should require authentication', async () => {
    const response = await request(app.server).get('/tournaments');

    expect(response.status).toBe(401);
  });

  it('should return 422 when query params are invalid', async () => {
    const response = await request(app.server)
      .get('/tournaments')
      .query({ limit: 'invalid' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(422);
  });
});

