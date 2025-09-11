import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InviteCodeInUseError } from '@/global/errors/InviteCodeInUseError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { CreatePoolUseCase } from './createPoolUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let tournamentsRepository: ITournamentsRepository;
let sut: CreatePoolUseCase;

// Mock UUID generation to have predictable results
vi.mock('node:crypto', () => {
  return {
    randomUUID: () => 'mocked-uuid',
  };
});

describe('Create Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new CreatePoolUseCase(poolsRepository, usersRepository, tournamentsRepository);
  });

  it('should be able to create a new pool', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    const pool = await sut.execute({
      name: 'My Pool',
      description: 'A pool for friends',
      tournamentId: tournament.id,
      creatorId: user.id,
      isPrivate: false,
      maxParticipants: 10,
      registrationDeadline: new Date(),
    });

    expect(pool.id).toEqual(expect.any(Number));
    expect(pool.name).toEqual('My Pool');
    expect(pool.description).toEqual('A pool for friends');
    expect(pool.isPrivate).toEqual(false);
    expect(pool.inviteCode).toEqual('CONVITE'); // Default from InMemoryPoolsRepository
  });

  it('should be able to create a private pool with invite code', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    const pool = await sut.execute({
      name: 'Private Pool',
      tournamentId: tournament.id,
      creatorId: user.id,
      isPrivate: true,
      inviteCode: 'INVITE123',
    });

    expect(pool.isPrivate).toEqual(true);
    expect(pool.inviteCode).toEqual('INVITE123');
  });

  it('should not allow duplicate invite codes', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    await sut.execute({
      name: 'Pool One',
      tournamentId: tournament.id,
      creatorId: user.id,
      isPrivate: true,
      inviteCode: 'DUPLICATE',
    });

    await expect(() =>
      sut.execute({
        name: 'Pool Two',
        tournamentId: tournament.id,
        creatorId: user.id,
        isPrivate: true,
        inviteCode: 'DUPLICATE',
      })
    ).rejects.toBeInstanceOf(InviteCodeInUseError);
  });

  it('should not be able to create a pool with non-existing user', async () => {
    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    await expect(() =>
      sut.execute({
        name: 'My Pool',
        tournamentId: tournament.id,
        creatorId: 'non-existing-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a pool with non-existing tournament', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    await expect(() =>
      sut.execute({
        name: 'My Pool',
        tournamentId: 999,
        creatorId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should create default scoring rules for the pool', async () => {
    const createScoringRulesSpy = vi.spyOn(poolsRepository, 'createScoringRules');

    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    const pool = await sut.execute({
      name: 'My Pool',
      tournamentId: tournament.id,
      creatorId: user.id,
    });

    expect(createScoringRulesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pool: { connect: { id: pool.id } },
        exactScorePoints: 3,
        correctWinnerGoalDiffPoints: 2,
        correctWinnerPoints: 1,
        correctDrawPoints: 1,
        specialEventPoints: 5,
        knockoutMultiplier: 1.5,
        finalMultiplier: 2.0,
      })
    );
  });

  it('should automatically add creator as participant', async () => {
    const addParticipantSpy = vi.spyOn(poolsRepository, 'addParticipant');

    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    const pool = await sut.execute({
      name: 'My Pool',
      tournamentId: tournament.id,
      creatorId: user.id,
    });

    expect(addParticipantSpy).toHaveBeenCalledWith({
      poolId: pool.id,
      userId: user.id,
    });
  });

  it('should use default values when optional parameters are not provided', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const tournament = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date(),
      endDate: new Date(),
    });

    const pool = await sut.execute({
      name: 'Basic Pool',
      tournamentId: tournament.id,
      creatorId: user.id,
    });

    expect(pool.isPrivate).toEqual(false);
    expect(pool.description).toEqual('');
  });
});
