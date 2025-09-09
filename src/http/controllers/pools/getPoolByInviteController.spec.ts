import { Pool } from '@prisma/client';
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

type GetPoolByInviteResponse = {
  pool: Pool;
};

describe('Get Pool By Invite Controller (e2e)', async () => {
  const app = await createTestApp();
  let token: string;
  let tournamentId: number;

  let poolsRepository: IPoolsRepository;
  let tournamentsRepository: ITournamentsRepository;
  let usersRepository: IUsersRepository;

  beforeAll(async () => {
    ({ token } = await getSupabaseAccessToken(app));

    poolsRepository = new PrismaPoolsRepository();
    tournamentsRepository = new PrismaTournamentsRepository();
    usersRepository = new PrismaUsersRepository();

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;
  });

  it('should return pool information for a valid invite code', async () => {
    const poolCreator = await createUser(usersRepository, { email: 'creator@example.com' });
    const pool = await createPool(poolsRepository, {
      creatorId: poolCreator.id,
      tournamentId,
      name: 'Invite Pool',
      inviteCode: 'INVITE-CODE',
      isPrivate: true,
    });

    const response = await request(app.server)
      .get(`/pool-invites/${pool.inviteCode}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    const body = response.body as GetPoolByInviteResponse;
    expect(body.pool).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Invite Pool',
        inviteCode: 'INVITE-CODE',
      })
    );
  });

  it('should return 404 when invite code does not exist', async () => {
    const response = await request(app.server)
      .get('/pool-invites/NON-EXISTING')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });
});
