import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '../../repositories/pools/InMemoryPoolsRepository';
import { InMemoryTournamentsRepository } from '../../repositories/tournaments/InMemoryTournamentsRepository';
import { InMemoryUsersRepository } from '../../repositories/users/InMemoryUsersRepository';
import { LeavePoolUseCase } from './leavePoolUseCase';

let poolsRepository: InMemoryPoolsRepository;
let usersRepository: InMemoryUsersRepository;
let tournamentsRepository: InMemoryTournamentsRepository;
let poolAuthorizationService: PoolAuthorizationService;
let sut: LeavePoolUseCase;

describe('Leave Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new LeavePoolUseCase(poolsRepository, usersRepository, poolAuthorizationService);
  });

  it('should be able to leave a pool', async () => {
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
    expect(participants[0].userId).toBe(participant.id);

    // Leave the pool
    await sut.execute({
      poolId: pool.id,
      userId: participant.id,
    });

    // Check if participant is no longer in the pool
    participants = await poolsRepository.getPoolParticipants(pool.id);
    expect(participants).toHaveLength(0);
  });

  it('should not be able to leave a pool if user is not found', async () => {
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
        userId: 'non-existent-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to leave a pool if pool is not found', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@example.com',
      fullName: 'Test User',
      passwordHash: 'hash',
    });

    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to leave a pool if user is not a participant', async () => {
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
        userId: nonParticipant.id,
      })
    ).rejects.toThrow('User is not a participant in this pool');
  });

  it('should not be able to leave a pool if user is the creator', async () => {
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

    // Add creator as participant (this might happen automatically in a real scenario)
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creator.id,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: creator.id,
      })
    ).rejects.toThrow('Pool creator cannot leave their own pool');
  });
});
