import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JoinPoolUseCase } from './joinPoolUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let sut: JoinPoolUseCase;

describe('Join Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new JoinPoolUseCase(poolsRepository, usersRepository);
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
    });

    // Mock getPoolParticipants to return only the creator
    //vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([{ userId: creator.id }]);

    // Mock addParticipant
    const addParticipantSpy = vi.spyOn(poolsRepository, 'addParticipant');

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
  });

  it('should be able to join a private pool with invite code', async () => {
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

    // Create a private pool with invite code
    const pool = await poolsRepository.create({
      name: 'Private Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: true,
      inviteCode: 'SECRET-CODE',
    });

    // Mock getPoolParticipants to return only the creator
    //vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([{ userId: creator.id }]);

    // Mock findByInviteCode
    //vi.spyOn(poolsRepository, 'findByInviteCode').mockResolvedValue(pool);

    // Mock addParticipant
    const addParticipantSpy = vi.spyOn(poolsRepository, 'addParticipant');

    // Join the pool using invite code
    const result = await sut.execute({
      inviteCode: 'SECRET-CODE',
      userId: joiner.id,
    });

    // Assertions
    expect(result.id).toEqual(pool.id);
    expect(addParticipantSpy).toHaveBeenCalledWith({
      poolId: pool.id,
      userId: joiner.id,
    });
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

  it('should not be able to join a private pool without invite code', async () => {
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

    // Attempt to join private pool without invite code
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: joiner.id,
      })
    ).rejects.toThrow('This pool is private and requires an invite code');
  });

  it('should not be able to join a private pool with incorrect invite code', async () => {
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

    // Mock findByInviteCode to return null (incorrect code)
    //vi.spyOn(poolsRepository, 'findByInviteCode').mockResolvedValue(null);

    // Attempt to join with incorrect invite code
    await expect(() =>
      sut.execute({
        inviteCode: 'WRONG-CODE',
        userId: joiner.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
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

    // Mock getPoolParticipants to return only creator
    // vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([{ userId: creator.id }]);

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

    // Mock getPoolParticipants to include the joiner (already a participant)
    // vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([
    //   { userId: creator.id },
    //   { userId: joiner.id },
    // ]);

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

  it('should require either poolId or inviteCode', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Attempt to join without poolId or inviteCode
    await expect(() =>
      sut.execute({
        userId: user.id,
      })
    ).rejects.toThrow('Either poolId or inviteCode must be provided');
  });
});
