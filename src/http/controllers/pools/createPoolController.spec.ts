import { createServer } from '@/app';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createTournament } from '@/test/mocks/tournament';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Pool Controller (e2e)', async () => {
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
    expect(response.body).toHaveProperty('pool');
    expect(response.body.pool).toHaveProperty('id');
    expect(response.body.pool.name).toBe('Test Pool');
    expect(response.body.pool.description).toBe('This is a test pool');
    expect(response.body.pool.tournamentId).toBe(tournamentId);
    expect(response.body.pool.creatorId).toBe(userId);
    expect(response.body.pool.isPrivate).toBe(true);
    expect(response.body.pool.maxParticipants).toBe(10);
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
    expect(response.body).toHaveProperty('message', 'Validation error');
    expect(response.body).toHaveProperty('issues');
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
    expect(response.body).toHaveProperty('message');
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
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Pool name already in use');
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
    expect(response.body.pool).toHaveProperty('isPrivate', false);
    expect(response.body.pool).toHaveProperty('name', 'Minimal Pool');
    expect(response.body.pool).toHaveProperty('tournamentId', tournamentId);
  });

  it('should create a private pool with an invite code', async () => {
    const inviteCode = 'TEST123';

    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Private Pool with Code',
        tournamentId,
        isPrivate: true,
        inviteCode,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.pool).toHaveProperty('isPrivate', true);
    expect(response.body.pool).toHaveProperty('inviteCode', inviteCode);
  });

  it('should handle all required fields', async () => {
    const response = await request(app.server)
      .post('/pools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing name and tournamentId
      });

    expect(response.statusCode).toBe(422);
    expect(response.body).toHaveProperty('message', 'Validation error');
    expect(response.body.issues).toHaveProperty('name');
    expect(response.body.issues).toHaveProperty('tournamentId');
  });
});
