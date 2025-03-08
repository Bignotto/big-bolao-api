import { EmailInUseError } from '@/global/errors/EmailInUseError';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateUserUseCase } from './createUserUseCase';

let usersRepository: IUsersRepository;
let sut: CreateUserUseCase;

describe('User Registration', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new CreateUserUseCase(usersRepository);
  });

  it('should be able create new user', async () => {
    const user = await sut.execute({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    expect(user.id).toEqual(expect.any(String));
  });

  it('should not be able to use email address twice', async () => {
    await sut.execute({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    await expect(() =>
      sut.execute({
        email: 'user@email.com',
        fullName: 'John Doe',
        accountProvider: 'EMAIL',
      })
    ).rejects.toBeInstanceOf(EmailInUseError);
  });

  it('should be able to create user with google account', async () => {
    const user = await sut.execute({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'GOOGLE',
    });

    expect(user.id).toEqual(expect.any(String));
    expect(user.accountProvider).toEqual('GOOGLE');
  });
});
