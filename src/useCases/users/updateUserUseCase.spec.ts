import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { UpdateUserUseCase } from './updateUserUseCase';

let usersRepository: IUsersRepository;
let sut: UpdateUserUseCase;

describe('Update User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new UpdateUserUseCase(usersRepository);
  });

  it('should be able to update user name', async () => {
    const createdUser = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const updatedUser = await sut.execute({
      userId: createdUser.id,
      fullName: 'Jane Doe',
    });

    expect(updatedUser.fullName).toEqual('Jane Doe');
    expect(updatedUser.email).toEqual(createdUser.email);
  });

  it('should be able to update user email', async () => {
    const createdUser = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    const updatedUser = await sut.execute({
      userId: createdUser.id,
      email: 'newemail@email.com',
    });

    expect(updatedUser.email).toEqual('newemail@email.com');
    expect(updatedUser.fullName).toEqual(createdUser.fullName);
  });

  it('should not be able to update non-existing user', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existing-id',
        fullName: 'Jane Doe',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
