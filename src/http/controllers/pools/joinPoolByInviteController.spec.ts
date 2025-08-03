import { Pool } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createServer } from '@/app';
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

type JoinPoolByInviteResponse = {
  pool: Pool;
};

type ErrorResponse = {
  message: string;
  code?: string;
  error?: string;
};

describe('Join Pool By Invite Controller (e2e)', async () => {
  const app = await createServer();
  let userId: string;
  let token: string;
  let tournamentId: number;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token, userId } = await getSupabaseAccessToken(app));

    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to join a private pool with correct invite code', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Private Pool',
      isPrivate: true,
      inviteCode: 'SECRET-CODE-123',
    });

    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');

    const body = response.body as JoinPoolByInviteResponse;
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Private Pool',
        isPrivate: true,
      })
    );

    // Verify user was added as participant
    const participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants.some((p) => p.id === userId)).toBe(true);
  });

  it('should be able to join a public pool with invite code', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'public-creator@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Public Pool',
      isPrivate: false,
      inviteCode: 'PUBLIC-CODE-456',
    });

    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pool');

    const body = response.body as JoinPoolByInviteResponse;
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

  it('should return 404 when invite code does not exist', async () => {
    const response = await request(app.server)
      .post('/pools/join/NON-EXISTENT-CODE')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Pool not found with this invite code');
  });

  it('should return 401 when user is already a participant', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-duplicate@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Duplicate Test Pool',
      inviteCode: 'DUPLICATE-CODE',
    });

    // First join
    await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    // Second join attempt
    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(401);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('User is already a participant in this pool');
  });

  it('should return 400 when pool has reached maximum participants', async () => {
    const poolCreator = await createUser(usersRepository, {
      email: 'creator-maxed@example.com',
    });

    const extraUser = await createUser(usersRepository, {
      email: 'extra@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Limited Pool',
      inviteCode: 'LIMITED-CODE',
      maxParticipants: 2,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: extraUser.id,
    });

    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
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
      inviteCode: 'EXPIRED-CODE',
      registrationDeadline: pastDate,
    });

    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
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
      inviteCode: 'AUTH-CODE',
    });

    const response = await request(app.server).post(`/pools/join/${pool.inviteCode}`).send();

    expect(response.statusCode).toEqual(401);
  });

  it('should validate invite code parameter', async () => {
    const response = await request(app.server)
      .post('/pools/join/')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(400); // Route not found without invite code
  });

  it('should handle empty invite code', async () => {
    const response = await request(app.server)
      .post('/pools/join/ ')
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
      inviteCode: 'CREATOR-PARTICIPANT-CODE',
    });

    const response = await request(app.server)
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolByInviteResponse;
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
      .post(`/pools/join/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);

    const body = response.body as JoinPoolByInviteResponse;
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
});
