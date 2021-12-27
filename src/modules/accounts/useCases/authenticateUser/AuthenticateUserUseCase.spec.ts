import { AppError } from '@shared/errors/AppError';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { UserInMemoryRepository } from '../../repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';

let usersRepository: UserInMemoryRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createUserUseCase: CreateUserUseCase;
let testUser: ICreateUserDTO;

describe('Authenticate User Use Case', () => {
  beforeEach(() => {
    usersRepository = new UserInMemoryRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
    createUserUseCase = new CreateUserUseCase(usersRepository);

    testUser = {
      name: 'Test Dude',
      email: 'dude@test.com',
      password: '123456',
    };
  });

  it('should authenticate user with correct email and password', async () => {
    await createUserUseCase.execute(testUser);

    const result = await authenticateUserUseCase.execute({
      email: 'dude@test.com',
      password: '123456',
    });

    expect(result).toHaveProperty('token');
  });

  it('should not authenticate non-existent user', async () => {
    await createUserUseCase.execute(testUser);

    await expect(
      authenticateUserUseCase.execute({
        email: 'invalid user',
        password: '123456',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not authenticate user with wrong password', async () => {
    await createUserUseCase.execute(testUser);

    await expect(
      authenticateUserUseCase.execute({
        email: 'dude@test.com',
        password: 'invalid password',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
