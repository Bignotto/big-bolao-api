import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createUser } from '@/test/mocks/users';

import { GetUserPoolStandingUseCase } from './getUserPoolsStandingsUseCase';

describe('GetUserPoolStandingUseCase', () => {
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let sut: GetUserPoolStandingUseCase;

  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new GetUserPoolStandingUseCase(poolsRepository, usersRepository);
  });

  it('should throw ResourceNotFoundError when user does not exist', async () => {
    await expect(() => sut.execute({ userId: 'non-existent-user-id' })).rejects.toThrow(
      ResourceNotFoundError
    );

    await expect(() => sut.execute({ userId: 'non-existent-user-id' })).rejects.toThrow(
      'User not found'
    );
  });

  // it('should return null standings when user has no pool standings', async () => {
  //   const user = await createUser(usersRepository, {
  //     fullName: 'User One',
  //     email: 'user1@example.com',
  //   });

  //   const { standing } = await sut.execute({ userId: user.id });

  //   expect(standing).toEqual([]);
  // });

  it('should return user pool standings when user exists and has standings', async () => {
    const user = await createUser(usersRepository, {
      fullName: 'User One',
      email: 'user1@example.com',
    });

    const { standing } = await sut.execute({ userId: user.id });

    expect(standing).not.toBeNull();
    expect(standing!.length).toBeGreaterThan(0);
    expect(standing![0]).toHaveProperty('poolId');
  });
});
