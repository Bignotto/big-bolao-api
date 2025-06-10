import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotParticipantError } from './errors/NotParticipantError';
import { GetPoolUsersUseCase } from './getPoolUsersUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let sut: GetPoolUsersUseCase;

describe('Get Pool Users Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new GetPoolUsersUseCase(poolsRepository, usersRepository);
  });

  it('should be able to get all users participating in a pool', async () => {
    // Create a user (pool creator)
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    // Create additional participants
    const participant1 = await usersRepository.create({
      email: 'participant1@email.com',
      fullName: 'Participant One',
      accountProvider: 'EMAIL',
    });

    const participant2 = await usersRepository.create({
      email: 'participant2@email.com',
      fullName: 'Participant Two',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: false,
    });

    // Add participants to the pool
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creator.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant1.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant2.id,
    });

    // Execute the use case
    const users = await sut.execute({
      poolId: pool.id,
      userId: creator.id,
    });

    // Assertions
    expect(users).toHaveLength(3);
    expect(users.map((user) => user.id)).toContain(creator.id);
    expect(users.map((user) => user.id)).toContain(participant1.id);
    expect(users.map((user) => user.id)).toContain(participant2.id);
  });

  it('should not be able to get pool users with non-existing user', async () => {
    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'existing-user-id' } },
    });

    // Attempt to get pool users with non-existing user
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: 'non-existing-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to get users from non-existing pool', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Attempt to get users from non-existing pool
    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow non-participants to get pool users', async () => {
    // Create a pool creator
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    // Create a non-participant user
    const nonParticipant = await usersRepository.create({
      email: 'nonparticipant@email.com',
      fullName: 'Non Participant',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
    });

    // Add only the creator as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creator.id,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: nonParticipant.id,
      })
    ).rejects.toBeInstanceOf(NotParticipantError);
  });

  it('should return empty array when pool has no participants', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Empty Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
    });

    // Execute the use case (note: the creator is not automatically added as a participant)
    const users = await sut.execute({
      poolId: pool.id,
      userId: user.id, // The creator can still access the pool
    });

    // Assertions
    expect(users).toHaveLength(0);
  });
});
