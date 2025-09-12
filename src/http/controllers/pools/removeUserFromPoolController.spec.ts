import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

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

type ErrorResponse = {
  message: string;
  code?: string;
  error?: string;
};

describe('Remove User From Pool Controller (e2e)', async () => {
  const app = await createTestApp();
  let userId: string;
  let token: string;

  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    ({ token, userId } = await getSupabaseAccessToken(app));
    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });


  it('should be able to remove a user from a pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const userToRemove = await createUser(usersRepository, {
      email: 'user-to-remove@example.com',
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userToRemove.id,
    });

    const response = await request(app.server)
      .delete(`/pools/${pool.id}/users/${userToRemove.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      message: 'User successfully removed from pool',
    });

    const participants = await poolsRepository.getPoolParticipants(pool.id);
    const isUserStillParticipant = participants.some(
      (participant) => participant.id === userToRemove.id
    );
    expect(isUserStillParticipant).toBe(false);
  });

  it('should return 404 when trying to remove a user from a non-existent pool', async () => {
    const nonExistentPoolId = 9999;
    const userToRemove = await createUser(usersRepository, {
      email: 'user-to-remove-non-existent-pool@example.com',
    });

    const response = await request(app.server)
      .delete(`/pools/${nonExistentPoolId}/users/${userToRemove.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 when trying to remove a non-existent user from a pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const nonExistentUserId = 'clh0000000000000000000000000'; // Non-existent CUID

    const response = await request(app.server)
      .delete(`/pools/${pool.id}/users/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 403 when a non-creator tries to remove a user from a pool', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    const poolOwner = await createUser(usersRepository, {
      email: 'pool-owner@example.com',
    });

    const pool = await createPool(poolsRepository, {
      creatorId: poolOwner.id,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    const userToRemove = await createUser(usersRepository, {
      email: 'user-to-remove-non-creator@example.com',
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userToRemove.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userId,
    });

    // Try to remove the user from the pool (should fail as authenticated user is not the creator)
    const response = await request(app.server)
      .delete(`/pools/${pool.id}/users/${userToRemove.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);

    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Unauthorized');
  });

  it('should return 403 when trying to remove a user who is not a participant', async () => {
    const tournament = await createTournament(tournamentsRepository, {});

    // Create a pool where the authenticated user is the owner
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });

    // Create a user who is not a participant
    const nonParticipantUser = await createUser(usersRepository, {
      email: 'non-participant@example.com',
    });

    // Try to remove the non-participant user
    const response = await request(app.server)
      .delete(`/pools/${pool.id}/users/${nonParticipantUser.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
    const body = response.body as ErrorResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('not a participant');
  });

  it('should require authentication', async () => {
    const tournament = await createTournament(tournamentsRepository, {});
    const pool = await createPool(poolsRepository, {
      creatorId: userId,
      tournamentId: tournament.id,
    });

    const userToRemove = await createUser(usersRepository, {
      email: 'user-to-remove-auth@example.com',
    });

    // Add the user to the pool
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userToRemove.id,
    });

    // Try to remove without authentication
    const response = await request(app.server).delete(`/pools/${pool.id}/users/${userToRemove.id}`);

    expect(response.statusCode).toEqual(401);
  });
});
