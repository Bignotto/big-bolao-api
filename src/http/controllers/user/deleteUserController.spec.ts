import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

describe('Delete User Controller (e2e)', () => {
  let app: FastifyInstance;
  let usersRepository: IUsersRepository;
  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;

  beforeAll(async () => {
    app = await createTestApp();
    usersRepository = new PrismaUsersRepository();
    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should require authentication', async () => {
    const response = await request(app.server).delete('/users/me');
    expect(response.statusCode).toEqual(401);
  });

  describe('with authenticated user', () => {
    let token: string;
    let userId: string;
    let tournamentId: number;

    beforeAll(async () => {
      const tournament = await createTournament(tournamentsRepository, {});
      tournamentId = tournament.id;
    });

    beforeEach(async () => {
      ({ token, userId } = await getSupabaseAccessToken(app));
    });

    it('should be able to delete own account', async () => {
      const response = await request(app.server)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toEqual(204);
    });

    it('should transfer pool ownership to the earliest-joined participant', async () => {
      const otherUser = await createUser(usersRepository, {});
      const pool = await createPool(poolsRepository, { creatorId: userId, tournamentId });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: otherUser.id });

      const response = await request(app.server)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toEqual(204);

      const updatedPool = await poolsRepository.findById(pool.id);
      expect(updatedPool).not.toBeNull();
      expect(updatedPool?.creatorId).toEqual(otherUser.id);
    });

    it('should delete pool when creator is the only participant', async () => {
      const pool = await createPool(poolsRepository, { creatorId: userId, tournamentId });

      const response = await request(app.server)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toEqual(204);

      const deletedPool = await poolsRepository.findById(pool.id);
      expect(deletedPool).toBeNull();
    });
  });
});
