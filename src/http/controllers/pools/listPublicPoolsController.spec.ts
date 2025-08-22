import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createServer } from '@/app';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createPool } from '@/test/mocks/pools';

describe('List Public Pools Controller (e2e)', async () => {
  const app = await createServer();
  let token: string;
  let poolsRepository: IPoolsRepository;

  beforeAll(async () => {
    await app.ready();
    ({ token } = await getSupabaseAccessToken(app));
    poolsRepository = new PrismaPoolsRepository();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list public pools with pagination and name filter', async () => {
    await createPool(poolsRepository, { name: 'Public Alpha', isPrivate: false });
    await createPool(poolsRepository, { name: 'Public Beta', isPrivate: false });
    await createPool(poolsRepository, { name: 'Secret Pool', isPrivate: true });

    const response = await request(app.server)
      .get('/pools')
      .query({ page: 1, perPage: 1, name: 'Public' })
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('pools');
    expect(response.body.pools).toHaveLength(1);
    expect(response.body.pools[0].name).toContain('Public');
  });
});
