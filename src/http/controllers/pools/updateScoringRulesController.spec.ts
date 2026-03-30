import { Pool, ScoringRule } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type UpdateScoringRulesResponse = {
  scoringRules: ScoringRule;
};

type ErrorResponse = {
  code?: string;
  error?: string;
  message: string;
  issues?: unknown;
};

describe('Update Scoring Rules Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;
  let pool: Pool;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Test Pool for Scoring Rules',
    });
  });

  beforeEach(async () => {
    if (pool) {
      await poolsRepository.deletePoolById(pool.id);
    }
    pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId,
      name: 'Test Pool for Scoring Rules',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update scoring rules successfully', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exactScorePoints: 8,
        correctWinnerGoalDiffPoints: 5,
        correctWinnerPoints: 3,
        correctDrawPoints: 3,
        knockoutMultiplier: 2.0,
        finalMultiplier: 3.0,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateScoringRulesResponse;
    expect(body).toHaveProperty('scoringRules');
    expect(body.scoringRules.exactScorePoints).toBe(8);
    expect(body.scoringRules.correctWinnerGoalDiffPoints).toBe(5);
    expect(body.scoringRules.correctWinnerPoints).toBe(3);
    expect(body.scoringRules.correctDrawPoints).toBe(3);
    expect(Number(body.scoringRules.knockoutMultiplier)).toBe(2.0);
    expect(Number(body.scoringRules.finalMultiplier)).toBe(3.0);
  });

  it('should update only the provided fields and leave others unchanged', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        exactScorePoints: 20,
      });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateScoringRulesResponse;
    expect(body.scoringRules.exactScorePoints).toBe(20);
    // These were set by createPool mock — should be unchanged
    expect(body.scoringRules.correctWinnerGoalDiffPoints).toBe(7);
    expect(body.scoringRules.correctWinnerPoints).toBe(5);
    expect(body.scoringRules.correctDrawPoints).toBe(5);
    expect(Number(body.scoringRules.knockoutMultiplier)).toBe(1.5);
    expect(Number(body.scoringRules.finalMultiplier)).toBe(2.0);
  });

  it('should return the correct response structure', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exactScorePoints: 5 });

    expect(response.statusCode).toEqual(200);

    const body = response.body as UpdateScoringRulesResponse;
    expect(body).toHaveProperty('scoringRules');
    expect(body.scoringRules).toHaveProperty('id');
    expect(body.scoringRules).toHaveProperty('poolId', pool.id);
    expect(body.scoringRules).toHaveProperty('exactScorePoints');
    expect(body.scoringRules).toHaveProperty('correctWinnerGoalDiffPoints');
    expect(body.scoringRules).toHaveProperty('correctWinnerPoints');
    expect(body.scoringRules).toHaveProperty('correctDrawPoints');
    expect(body.scoringRules).toHaveProperty('knockoutMultiplier');
    expect(body.scoringRules).toHaveProperty('finalMultiplier');
  });

  it('should return 401 when no authentication token is provided', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .send({ exactScorePoints: 5 });

    expect(response.statusCode).toBe(401);
  });

  it('should return 403 when the user is not the pool creator', async () => {
    const otherOwner = await createUser(usersRepository, {
      email: 'other-owner@example.com',
    });

    const otherPool = await createPool(poolsRepository, {
      creatorId: otherOwner.id,
      tournamentId,
    });

    const response = await request(app.server)
      .put(`/pools/${otherPool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exactScorePoints: 5 });

    expect(response.statusCode).toBe(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Not pool creator');
  });

  it('should return 404 when the pool does not exist', async () => {
    const response = await request(app.server)
      .put('/pools/9999999/scoring-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ exactScorePoints: 5 });

    expect(response.statusCode).toBe(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not found');
  });

  it('should return 422 when a point value is zero', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ exactScorePoints: 0 });

    expect(response.statusCode).toBe(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
    expect(body).toHaveProperty('issues');
  });

  it('should return 422 when a point value is negative', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ correctWinnerPoints: -1 });

    expect(response.statusCode).toBe(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
  });

  it('should return 422 when a multiplier is below 1', async () => {
    const response = await request(app.server)
      .put(`/pools/${pool.id}/scoring-rules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ knockoutMultiplier: 0.5 });

    expect(response.statusCode).toBe(422);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message', 'Validation error');
  });

  it('should return 400 when the pool ID is not a number', async () => {
    const response = await request(app.server)
      .put('/pools/invalid-id/scoring-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({ exactScorePoints: 5 });

    expect(response.statusCode).toBe(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });
});
