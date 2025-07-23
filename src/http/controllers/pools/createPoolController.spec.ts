import { Pool } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createTournament } from '@/test/mocks/tournament';

type CreatePoolResponse = {
  pool: Pool;
};

type ErrorResponse = {
  message: string;
  issues?: any;
};

describe('Create Pool Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;

  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));
    tournamentsRepository = new PrismaTournamentsRepository();

    // Create a tournament for testing
    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new pool', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Pool',
        description: 'This is a test pool',
        tournamentId,
        isPrivate: true,
        maxParticipants: 10,
        //registrationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      });

    expect(response.statusCode).toEqual(201);

    const body = response.body as CreatePoolResponse;
    expect(body).toHaveProperty('pool');
    expect(body.pool).toHaveProperty('id');
    expect(body.pool.name).toBe('Test Pool');
    expect(body.pool.description).toBe('This is a test pool');
    expect(body.pool.tournamentId).toBe(tournamentId);
    expect(body.pool.creatorId).toBe(userId);
    expect(body.pool.isPrivate).toBe(true);
    expect(body.pool.maxParticipants).toBe(10);
  });

  it('should return 422 when validation fails', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Te', // Too short
        tournamentId,
      });

    expect(response.statusCode).toBe(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
    expect(body).toHaveProperty('issues');
  });

  it('should return 404 when tournament does not exist', async () => {
    const nonExistentTournamentId = 9999;

    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Pool',
        description: 'This is a test pool',
        tournamentId: nonExistentTournamentId,
      });

    expect(response.statusCode).toBe(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
  });

  it('should return 409 when pool name is already in use', async () => {
    const poolName = 'Duplicate Pool Name';
    await request(app.server).post('/pools').set('Authorization', `Bearer ${token}`).send({
      name: poolName,
      tournamentId,
    });

    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: poolName,
        tournamentId,
      });

    expect(response.statusCode).toBe(409);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool name already in use');
  });

  it('should require authentication', async () => {
    const response = await request(app.server).post('/pools').send({
      name: 'Unauthenticated Pool',
      tournamentId,
    });

    expect(response.statusCode).toBe(401);
  });

  it('should create a pool with default values when optional fields are not provided', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Minimal Pool',
        tournamentId,
      });

    expect(response.statusCode).toBe(201);

    const body = response.body as CreatePoolResponse;
    expect(body.pool).toHaveProperty('isPrivate', false);
    expect(body.pool).toHaveProperty('name', 'Minimal Pool');
    expect(body.pool).toHaveProperty('tournamentId', tournamentId);
  });

  it('should create a private pool with an invite code', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inviteCode: 'TEST123',
        name: 'Private Pool with Code',
        tournamentId,
        isPrivate: true,
      });

    expect(response.statusCode).toBe(201);

    const body = response.body as CreatePoolResponse;
    expect(body.pool).toHaveProperty('isPrivate', true);
    expect(body.pool).toHaveProperty('inviteCode', 'TEST123');
  });

  it('should handle all required fields', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing name and tournamentId
      });
    console.log(JSON.stringify(response.body, null, 2), 'from createPoolController.spec.ts');

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });
});
