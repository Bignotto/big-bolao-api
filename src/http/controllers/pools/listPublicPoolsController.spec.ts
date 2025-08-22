import { Pool } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

type ListPublicPoolsResponse = {
  pools: Pool[];
};

describe('List Public Pools Controller (e2e)', async () => {
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

    const userA = await createUser(usersRepository, {
      email: 'dunha@gmail.com',
      fullName: 'Dunha',
      profileImageUrl: 'http://avatar.com/dunha.png',
    });

    const tournament = await createTournament(tournamentsRepository, {});

    await createPool(poolsRepository, {
      name: 'Public Alpha',
      description: 'First public pool',
      creatorId: userA.id,
      tournamentId: tournament.id,
      isPrivate: false,
    });
    await createPool(poolsRepository, {
      name: 'Public Beta',
      description: 'Second public pool',
      creatorId: userId,
      tournamentId: tournament.id,
      isPrivate: false,
    });
    await createPool(poolsRepository, {
      name: 'Secret Pool',
      description: 'A private pool',
      creatorId: userA.id,
      tournamentId: tournament.id,
      isPrivate: true,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list public pools with pagination and name filter', async () => {
    const response = await request(app.server)
      .get('/pools')
      .query({ page: 1, perPage: 1, name: 'Public' })
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');

    const body = response.body as ListPublicPoolsResponse;
    expect(body.pools).toHaveLength(1);
    expect(body.pools[0].name).toContain('Public');
  });

  it('should return empty list if no public pools match the name filter', async () => {
    const response = await request(app.server)
      .get('/pools')
      .query({ page: 1, perPage: 10, name: 'NonExistentPool' })
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');

    const body = response.body as ListPublicPoolsResponse;
    expect(body.pools).toHaveLength(0);
  });

  it('should list public pools without name filter', async () => {
    const response = await request(app.server)
      .get('/pools')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');

    const body = response.body as ListPublicPoolsResponse;
    expect(body.pools.length).toBeGreaterThanOrEqual(2);
    body.pools.forEach((pool) => {
      expect(pool.isPrivate).toBe(false);
    });
  });

  it('should not list private pools', async () => {
    const response = await request(app.server)
      .get('/pools')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');

    const body = response.body as ListPublicPoolsResponse;
    body.pools.forEach((pool) => {
      expect(pool.isPrivate).toBe(false);
    });
  });
});
