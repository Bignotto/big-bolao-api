import bcryptjs from 'bcryptjs';

import { AppError } from '@shared/errors/AppError';
import { UserInMemoryRepository } from '../../repositories/inMemory/UserInMemoryRepository';

import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { UpdatePasswordUseCase } from './UpdatePasswordUseCase';
import { AuthenticateUserUseCase } from '../authenticateUser/AuthenticateUserUseCase';

let userRepository: UserInMemoryRepository;

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let updatePasswordUseCase: UpdatePasswordUseCase;

describe('Update Password Use Case', () => {
  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    createUserUseCase = new CreateUserUseCase(userRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(userRepository);
    updatePasswordUseCase = new UpdatePasswordUseCase(userRepository);
  });

  it('should be able to update logged users password', async () => {
    const createdUser = await createUserUseCase.execute({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    const updatedUser = await updatePasswordUseCase.execute({
      password: '123456',
      newPassword: 'asdfgh',
      userId: createdUser.id,
    });

    const response = await authenticateUserUseCase.execute({
      password: 'asdfgh',
      email: updatedUser.email,
    });

    expect(response).toHaveProperty('token');
  });

  it('should not be able to log in with old password', async () => {
    const createdUser = await createUserUseCase.execute({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    const updatedUser = await updatePasswordUseCase.execute({
      password: '123456',
      newPassword: 'asdfgh',
      userId: createdUser.id,
    });

    await expect(
      authenticateUserUseCase.execute({
        email: 'test@server.com',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to update password with wrong password', async () => {
    const createdUser = await createUserUseCase.execute({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    await expect(
      updatePasswordUseCase.execute({
        password: 'invalid password',
        newPassword: 'asdfgh',
        userId: createdUser.id,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to update password with invalid user', async () => {
    await createUserUseCase.execute({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    await expect(
      updatePasswordUseCase.execute({
        password: '123456',
        newPassword: 'asdfgh',
        userId: 'invalid user',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
