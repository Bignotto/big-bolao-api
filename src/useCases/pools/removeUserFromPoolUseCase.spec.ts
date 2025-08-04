import { beforeEach, describe, expect, it } from 'vitest';

import { RemoveUserFromPoolUseCase } from './removeUserFromPoolUseCase';
import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '../../repositories/pools/InMemoryPoolsRepository';
import { InMemoryTournamentsRepository } from '../../repositories/tournaments/InMemoryTournamentsRepository';
import { InMemoryUsersRepository } from '../../repositories/users/InMemoryUsersRepository';

let poolsRepository: InMemoryPoolsRepository;
let usersRepository: InMemoryUsersRepository;
let tournamentsRepository: InMemoryTournamentsRepository;
let sut: RemoveUserFromPoolUseCase;

describe('Remove User From Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new RemoveUserFromPoolUseCase(poolsRepository, usersRepository);
  });

  it('should be able to remove a user from a pool', async () => {
    // Create a tournament
    const tournament = await tournamentsRepository.create({
      name: 'Tournament Test',
      startDate: new Date(),
      endDate: new Date(),
    });

    // Create a creator user
    const creator = await usersRepository.create({
      email: 'creator@example.com',
      fullName: 'Creator User',
      passwordHash: 'hash',
    });

    // Create a participant user
    const participant = await usersRepository.create({
      email: 'participant@example.com',
      fullName: 'Participant User',
      passwordHash: 'hash',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: {
        connect: {
          id: tournament.id,
        },
      },
      creator: {
        connect: {
          id: creator.id,
        },
      },
      isPrivate: false,
      maxParticipants: 10,
      registrationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
    });

    // Add participant to the pool
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant.id,
    });

    // Check if participant is in the pool
    let participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants).toHaveLength(1);
    expect(participants[0].id).toBe(participant.id);

    // Remove the user from the pool
    await sut.execute({
      poolId: pool.id,
      userIdToRemove: participant.id,
      creatorId: creator.id,
    });

    // Check if participant is no longer in the pool
    participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants).toHaveLength(0);
  });

  it('should not be able to remove a user if pool is not found', async () => {
    // Create users
    const creator = await usersRepository.create({
      email: 'creator@example.com',
      fullName: 'Creator User',
      passwordHash: 'hash',
    });

    const participant = await usersRepository.create({
      email: 'participant@example.com',
      fullName: 'Participant User',
      passwordHash: 'hash',
    });

    await expect(() =>
      sut.execute({
        poolId: 999,
        userIdToRemove: participant.id,
        creatorId: creator.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to remove a user if requester is not the pool creator', async () => {
    // Create a tournament
    const tournament = await tournamentsRepository.create({
      name: 'Tournament Test',
      startDate: new Date(),
      endDate: new Date(),
    });

    // Create a creator user
    const creator = await usersRepository.create({
      email: 'creator@example.com',
      fullName: 'Creator User',
      passwordHash: 'hash',
    });

    // Create another user
    const otherUser = await usersRepository.create({
      email: 'other@example.com',
      fullName: 'Other User',
      passwordHash: 'hash',
    });

    // Create a participant user
    const participant = await usersRepository.create({
      email: 'participant@example.com',
      fullName: 'Participant User',
      passwordHash: 'hash',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: {
        connect: {
          id: tournament.id,
        },
      },
      creator: {
        connect: {
          id: creator.id,
        },
      },
      isPrivate: false,
    });

    // Add participant to the pool
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant.id,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userIdToRemove: participant.id,
        creatorId: otherUser.id, // Not the creator
      })
    ).rejects.toThrow('Only the pool creator can remove users');
  });

  it('should not be able to remove a user that does not exist', async () => {
    // Create a tournament
    const tournament = await tournamentsRepository.create({
      name: 'Tournament Test',
      startDate: new Date(),
      endDate: new Date(),
    });

    // Create a creator user
    const creator = await usersRepository.create({
      email: 'creator@example.com',
      fullName: 'Creator User',
      passwordHash: 'hash',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: {
        connect: {
          id: tournament.id,
        },
      },
      creator: {
        connect: {
          id: creator.id,
        },
      },
      isPrivate: false,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userIdToRemove: 'non-existent-user-id',
        creatorId: creator.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to remove a user that is not a participant', async () => {
    // Create a tournament
    const tournament = await tournamentsRepository.create({
      name: 'Tournament Test',
      startDate: new Date(),
      endDate: new Date(),
    });

    // Create a creator user
    const creator = await usersRepository.create({
      email: 'creator@example.com',
      fullName: 'Creator User',
      passwordHash: 'hash',
    });

    // Create a non-participant user
    const nonParticipant = await usersRepository.create({
      email: 'nonparticipant@example.com',
      fullName: 'Non Participant User',
      passwordHash: 'hash',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: {
        connect: {
          id: tournament.id,
        },
      },
      creator: {
        connect: {
          id: creator.id,
        },
      },
      isPrivate: false,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userIdToRemove: nonParticipant.id,
        creatorId: creator.id,
      })
    ).rejects.toThrow('User is not a participant in this pool');
  });
});
