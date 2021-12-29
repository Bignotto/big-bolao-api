import { AppError } from '@shared/errors/AppError';
import { UserInMemoryRepository } from '@modules/accounts/repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from '../createUser/CreateUserUseCase';
import { ListUsersUseCase } from './ListUsersUseCase';

let createUserUseCase: CreateUserUseCase;
let listUsersUseCase: ListUsersUseCase;
let userRepository: UserInMemoryRepository;

describe('Create User Use Case', () => {
  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    listUsersUseCase = new ListUsersUseCase(userRepository);
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it('should be able to list all users in database', async () => {
    let usersList = await listUsersUseCase.execute();
    expect(usersList.length).toBe(0);

    await createUserUseCase.execute({
      name: 'Test User 1',
      email: 'test@server.com',
      password: '123456',
    });

    usersList = await listUsersUseCase.execute();
    expect(usersList.length).toBe(1);

    await createUserUseCase.execute({
      name: 'Test User 2',
      email: 'test2@server.com',
      password: '123456',
    });

    usersList = await listUsersUseCase.execute();
    expect(usersList.length).toBe(2);

    await createUserUseCase.execute({
      name: 'Test User 3',
      email: 'test3@server.com',
      password: '123456',
    });

    usersList = await listUsersUseCase.execute();
    expect(usersList.length).toBe(3);
  });

  it('should not show password field in user list', async () => {
    await createUserUseCase.execute({
      name: 'Test User 1',
      email: 'test@server.com',
      password: '123456',
    });

    const usersList = await listUsersUseCase.execute();
    expect(usersList[0]).not.toHaveProperty('password');
  });
});
