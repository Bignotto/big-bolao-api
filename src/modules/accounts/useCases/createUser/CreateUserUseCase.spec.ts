import { AppError } from '@shared/errors/AppError';
import { UserInMemoryRepository } from '../../repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from './CreateUserUseCase';

import bcryptjs from 'bcryptjs';

let createUserUseCase: CreateUserUseCase;
let userRepository: UserInMemoryRepository;

describe('Create User Use Case', () => {
  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it('should create a new user object', async () => {
    const createdUser = await createUserUseCase.execute({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    expect(createdUser).toHaveProperty('id');
  });

  it('should not be able to register a user with email address already in use', async () => {
    await createUserUseCase.execute({
      name: 'Test User 1',
      email: 'test@server.com',
      password: '123456',
    });

    await expect(async () =>
      createUserUseCase.execute({
        name: 'Test User 2',
        email: 'test@server.com',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to create a user without a valid email address', async () => {
    await expect(async () =>
      createUserUseCase.execute({
        name: 'Test user',
        email: '',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(async () =>
      createUserUseCase.execute({
        name: 'Test user',
        email: 'test',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should encrypt user password', async () => {
    const hashPassword = jest.spyOn(bcryptjs, 'hash');
    await createUserUseCase.execute({
      name: 'Test user',
      email: 'test@test.com',
      password: '123456',
    });

    expect(hashPassword).toHaveBeenCalledWith('123456', 8);
  });

  it('should not be able to create user with password less than 6 characters', async () => {
    await expect(async () =>
      createUserUseCase.execute({
        name: 'Test user',
        email: 'test@test.com',
        password: '12345',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
