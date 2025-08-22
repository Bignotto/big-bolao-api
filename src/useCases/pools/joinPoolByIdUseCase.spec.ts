import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { UnauthorizedError } from './errors/UnauthorizedError';
import { JoinPoolByIdUseCase } from './joinPoolByIdUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let sut: JoinPoolByIdUseCase;

describe('Join Pool By ID Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new JoinPoolByIdUseCase(poolsRepository, usersRepository);
  });

  it('should be able to join a public pool by ID', async () => {
    // Create a user (pool creator)
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    // Create a user who will join the pool
    const joiner = await usersRepository.create({
      email: 'joiner@email.com',
      fullName: 'Pool Joiner',
      accountProvider: 'EMAIL',
    });

    // Create a public pool
    const pool = await poolsRepository.create({
      name: 'Public Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: false,
      maxParticipants: 10,
    });

    // Mock repository methods
    const addParticipantSpy = vi.spyOn(poolsRepository, 'addParticipant');
    const getParticipantsSpy = vi.spyOn(poolsRepository, 'getPoolParticipants');

    // Join the pool
    const result = await sut.execute({
      poolId: pool.id,
      userId: joiner.id,
    });

    // Assertions
    expect(result.id).toEqual(pool.id);
    expect(addParticipantSpy).toHaveBeenCalledWith({
      poolId: pool.id,
      userId: joiner.id,
    });
    expect(getParticipantsSpy).toHaveBeenCalledTimes(1);
  });

  it('should not be able to join a pool with non-existing user', async () => {
    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'existing-user-id' } },
    });

    // Attempt to join with non-existing user
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: 'non-existing-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to join a non-existing pool', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Attempt to join non-existing pool
    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to join a private pool by ID', async () => {
    // Create users
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const joiner = await usersRepository.create({
      email: 'joiner@email.com',
      fullName: 'Pool Joiner',
      accountProvider: 'EMAIL',
    });

    // Create a private pool
    const pool = await poolsRepository.create({
      name: 'Private Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: true,
      inviteCode: 'SECRET-CODE',
    });

    // Attempt to join private pool by ID
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: joiner.id,
      })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should not be able to join a pool that has reached maximum participants', async () => {
    // Create users
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const joiner = await usersRepository.create({
      email: 'joiner@email.com',
      fullName: 'Pool Joiner',
      accountProvider: 'EMAIL',
    });

    const extra = await usersRepository.create({
      email: 'extra@email.com',
      fullName: 'Pool extra',
      accountProvider: 'EMAIL',
    });

    // Create a pool with max 2 participants
    const pool = await poolsRepository.create({
      name: 'Limited Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      maxParticipants: 2,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creator.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: extra.id,
    });

    // Attempt to join full pool
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: joiner.id,
      })
    ).rejects.toThrow('Pool has reached maximum number of participants');
  });

  it('should not be able to join a pool after registration deadline', async () => {
    // Create users
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const joiner = await usersRepository.create({
      email: 'joiner@email.com',
      fullName: 'Pool Joiner',
      accountProvider: 'EMAIL',
    });

    // Create a pool with past registration deadline
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const pool = await poolsRepository.create({
      name: 'Closed Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      registrationDeadline: pastDate,
    });

    // Attempt to join after deadline
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: joiner.id,
      })
    ).rejects.toThrow('Registration deadline has passed');
  });

  it('should not be able to join a pool if already a participant', async () => {
    // Create users
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const joiner = await usersRepository.create({
      email: 'joiner@email.com',
      fullName: 'Pool Joiner',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: joiner.id,
    });

    // Attempt to join again
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: joiner.id,
      })
    ).rejects.toThrow('User is already a participant in this pool');
  });
});
