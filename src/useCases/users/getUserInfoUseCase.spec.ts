import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetUserInfoUseCase } from './getUserInfoUseCase';

describe('Get User Info Use Case', () => {
  let usersRepository: InMemoryUsersRepository;
  let sut: GetUserInfoUseCase;

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new GetUserInfoUseCase(usersRepository);
  });

  it('should be able to get user info', async () => {
    const createdUser = await usersRepository.create({
      email: 'john@example.com',
      fullName: 'John Doe',
      passwordHash: '123456',
      profileImageUrl: 'http://example.com/image.jpg',
      accountProvider: 'EMAIL',
    });

    const { id } = createdUser;

    const user = await sut.execute({
      userId: id,
    });

    expect(user.id).toEqual(id);
    expect(user.email).toEqual('john@example.com');
    expect(user.fullName).toEqual('John Doe');
  });

  it('should not be able to get info from non-existent user', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
