import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotPoolCreatorError } from './errors/NotPoolCreatorError';
import { UpdatePoolUseCase } from './updatePoolUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let sut: UpdatePoolUseCase;

describe('Update Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new UpdatePoolUseCase(poolsRepository, usersRepository);
  });

  it('should be able to update a pool', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'Original Pool Name',
      description: 'Original description',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    const updatedPool = await sut.execute({
      poolId: pool.id,
      userId: user.id,
      name: 'Updated Pool Name',
      description: 'Updated description',
      isPrivate: true,
      maxParticipants: 20,
    });

    expect(updatedPool.name).toEqual('Updated Pool Name');
    expect(updatedPool.description).toEqual('Updated description');
    expect(updatedPool.isPrivate).toEqual(true);
    expect(updatedPool.maxParticipants).toEqual(20);
  });

  it('should not be able to update a pool with non-existing user', async () => {
    const pool = await poolsRepository.create({
      name: 'Original Pool Name',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'existing-user-id' } },
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: 'non-existing-user-id',
        name: 'Updated Pool Name',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to update a non-existing pool', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
        name: 'Updated Pool Name',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow a user to update a pool they did not create', async () => {
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const otherUser = await usersRepository.create({
      email: 'other@email.com',
      fullName: 'Other User',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'Original Pool Name',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: otherUser.id,
        name: 'Updated Pool Name',
      })
    ).rejects.toBeInstanceOf(NotPoolCreatorError);
  });

  it('should only update the fields that are provided', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'Original Pool Name',
      description: 'Original description',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    const updatedPool = await sut.execute({
      poolId: pool.id,
      userId: user.id,
      name: 'Updated Pool Name',
      // No other fields provided
    });

    expect(updatedPool.name).toEqual('Updated Pool Name');
    expect(updatedPool.description).toEqual('Original description');
    expect(updatedPool.isPrivate).toEqual(false);
  });

  it('should be able to update registration deadline', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'Original Pool Name',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
    });

    const newDeadline = new Date('2023-12-31T23:59:59Z');

    const updatedPool = await sut.execute({
      poolId: pool.id,
      userId: user.id,
      registrationDeadline: newDeadline,
    });

    expect(updatedPool.registrationDeadline).toEqual(newDeadline);
  });
});
