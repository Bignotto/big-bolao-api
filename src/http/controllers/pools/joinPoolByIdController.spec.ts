import { Pool } from '@prisma/client';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from '@/test/helper-e2e';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

type JoinPoolByIdResponse = {
  pool: Pool;
};

type ErrorResponse = {
  message: string;
  code?: string;
  error?: string;
};

describe('Join Pool By ID Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;
  let tournamentId: number;

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
  });


  it('should be able to join a public pool by ID', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Public Pool',
      isPrivate: false,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');

    const body = response.body as JoinPoolByIdResponse;
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Public Pool',
        isPrivate: false,
      })
    );

    // Verify user was added as participant
    const participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants.some((p) => p.id === userId)).toBe(true);
  });

  it('should return 403 when trying to join a private pool by ID', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'private-creator@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Private Pool',
      isPrivate: true,
      inviteCode: 'SECRET-CODE',
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain(
      'This pool is private and can only be joined with an invite code'
    );

    // Verify user was NOT added as participant
    const participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants.some((p) => p.id === userId)).toBe(false);
  });

  it('should return 404 when pool does not exist', async () => {
    const nonExistentPoolId = 9999;

    const response = await request(app.server)
      .post(`/pools/${nonExistentPoolId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool not found');
  });

  // it('should return 404 when user does not exist', async () => {
  //   const poolCreator = await createUser(usersRepository, {
  //     email: 'creator-nonuser@example.com',
  //   });

  //   const pool = await createPool(poolsRepository, {
  //     creatorId: poolCreator.id,
  //     tournamentId,
  //     name: 'Test Pool',
  //     isPrivate: false,
  //   });

  //   // Mock a token with non-existent user ID
  //   const fakeToken = await getSupabaseAccessToken(app, 'non-existent-user-id');

  //   const response = await request(app.server)
  //     .post(`/pools/${pool.id}/users`)
  //     .set('Authorization', `Bearer ${fakeToken.token}`)
  //     .send();

  //   expect(response.statusCode).toEqual(404);

  //   const body = response.body as ErrorResponse;
  //   expect(body).toHaveProperty('message');
  //   expect(body.message).toContain('User not found');
  // });

  it('should return 403 when user is already a participant', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-duplicate@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Duplicate Test Pool',
      isPrivate: false,
    });

    // First join
    await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    // Second join attempt
    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('User is already a participant in this pool');
  });

  it('should return 400 when pool has reached maximum participants', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-maxed@example.com',
    });

    const extraUser = await createUser(usersRepository, {
      email: 'extraA@example.com',
    });

    const extraUser2 = await createUser(usersRepository, {
      email: 'extraB@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Limited Pool',
      isPrivate: false,
      maxParticipants: 2,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: extraUser.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: extraUser2.id,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool has reached maximum number of participants');
  });

  it('should return 400 when registration deadline has passed', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-deadline@example.com',
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Expired Pool',
      isPrivate: false,
      registrationDeadline: pastDate,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Registration deadline has passed');
  });

  it('should require authentication', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-auth@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Auth Test Pool',
      isPrivate: false,
    });

    const response = await request(app.server).post(`/pools/${pool.id}/users`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should validate pool ID parameter', async () => {
    const response = await request(app.server)
      .post('/pools/invalid-id/users')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should handle negative pool ID', async () => {
    const response = await request(app.server)
      .post('/pools/-1/users')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('code', 'FST_ERR_VALIDATION');
    expect(body).toHaveProperty('error', 'Bad Request');
  });

  it('should successfully join pool even when creator is also a participant', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-participant@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Creator Participant Pool',
      isPrivate: false,
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolByIdResponse;
    expect(body.pool.id).toBe(pool.id);

    // Verify both creator and new user are participants
    const participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants.length).toBe(2);
    expect(participants.some((p) => p.id === poolCreator.id)).toBe(true);
    expect(participants.some((p) => p.id === userId)).toBe(true);
  });

  it('should return proper pool information in response', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-info@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Information Test Pool',
      description: 'Test pool description',
      isPrivate: true,
      inviteCode: 'INFO-CODE',
      maxParticipants: 10,
    });

    const response = await request(app.server)
      .post(`/pool-invites/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolByIdResponse;
    expect(body.pool).toHaveProperty('id');
    expect(body.pool).toHaveProperty('creatorId');
    expect(body.pool).toHaveProperty('name');
    expect(body.pool).toHaveProperty('description');
    expect(body.pool).toHaveProperty('isPrivate');
    expect(body.pool).toHaveProperty('inviteCode');
    expect(body.pool).toHaveProperty('maxParticipants');

    // Verify all expected properties are present
    expect(body.pool.id).toBe(pool.id);
    expect(body.pool.name).toBe('Information Test Pool');
    expect(body.pool.isPrivate).toBe(true);
  });

  it('should handle zero as pool ID', async () => {
    const response = await request(app.server)
      .post('/pools/0/users')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool not found');
  });

  it('should handle very large pool ID', async () => {
    const veryLargeId = 999999999;

    const response = await request(app.server)
      .post(`/pools/${veryLargeId}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool not found');
  });

  it('should successfully join a pool with minimal configuration', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-minimal@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Minimal Pool',
      isPrivate: false,
      // No description, maxParticipants, registrationDeadline, etc.
    });

    const response = await request(app.server)
      .post(`/pools/${pool.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolByIdResponse;
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Minimal Pool',
        isPrivate: false,
      })
    );

    // Verify user was added as participant
    const participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants.some((p) => p.id === userId)).toBe(true);
  });

  // it('should not allow joining when pool has no maxParticipants but is logically full', async () => {
  //   // This test ensures that if there are business rules about maximum participants
  //   // beyond the maxParticipants field, they are respected
  //   const poolCreator = await createUser(usersRepository, {
  //     email: 'creator-business-rule@example.com',
  //   });

  //   const pool = await createPool(poolsRepository, {
  //     creatorId: poolCreator.id,
  //     tournamentId,
  //     name: 'Business Rule Pool',
  //     isPrivate: false,
  //     maxParticipants: null, // No explicit limit
  //   });

  //   const response = await request(app.server)
  //     .post(`/pools/${pool.id}/users`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .send();

  //   expect(response.statusCode).toEqual(200);

  //   const body = response.body as JoinPoolByIdResponse;
  //   expect(body.pool.id).toBe(pool.id);
  // });
});
