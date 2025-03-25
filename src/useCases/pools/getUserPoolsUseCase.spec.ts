import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetUserPoolsUseCase } from './getUserPoolsUseCase';

let poolsRepository: InMemoryPoolsRepository;
let usersRepository: InMemoryUsersRepository;
let sut: GetUserPoolsUseCase;

describe('Get User Pools Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new GetUserPoolsUseCase(poolsRepository, usersRepository);
  });

  it('should throw if user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existing-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return empty array if user has no pools', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'johndoe@example.com',
      fullName: 'John Doe',
      passwordHash: 'passwordHash123',
    });

    const { pools } = await sut.execute({
      userId: user.id,
    });

    expect(pools).toHaveLength(0);
  });

  it('should return pools where user is creator', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'johndoe@example.com',
      fullName: 'John Doe',
      passwordHash: 'passwordHash123',
    });

    // Create pools where user is creator
    const pool1 = await poolsRepository.create({
      name: 'Test Pool A',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    const pool2 = await poolsRepository.create({
      name: 'Test Pool B',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    const { pools } = await sut.execute({
      userId: user.id,
    });

    expect(pools).toHaveLength(2);
    expect(pools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: pool1.id }),
        expect.objectContaining({ id: pool2.id }),
      ])
    );
  });

  it('should return pools where user is participant', async () => {
    // Create users
    const user = await usersRepository.create({
      email: 'johndoe@example.com',
      fullName: 'John Doe',
      passwordHash: 'passwordHash123',
    });

    const otherUser = await usersRepository.create({
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      passwordHash: 'passwordHash123',
    });

    // Create a pool where other user is creator
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    const { pools } = await sut.execute({
      userId: user.id,
    });

    expect(pools).toHaveLength(1);
    expect(pools[0].id).toBe(pool.id);
  });

  it('should return both pools where user is creator and participant', async () => {
    // Create users
    const user = await usersRepository.create({
      email: 'johndoe@example.com',
      fullName: 'John Doe',
      passwordHash: 'passwordHash123',
    });

    const otherUser = await usersRepository.create({
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      passwordHash: 'passwordHash123',
    });

    // Create a pool where user is creator
    const createdPool = await poolsRepository.create({
      name: 'Test Pool',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Create a pool where other user is creator
    const participantPool = await poolsRepository.create({
      name: 'Test Pool',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant to the other pool
    await poolsRepository.addParticipant({
      poolId: participantPool.id,
      userId: user.id,
    });

    const { pools } = await sut.execute({
      userId: user.id,
    });

    expect(pools).toHaveLength(2);
    expect(pools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createdPool.id }),
        expect.objectContaining({ id: participantPool.id }),
      ])
    );
  });
});
