import { UserInMemoryRepository } from '../../repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from './CreateUserUseCase';

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
      password: '12345',
    });

    expect(createdUser).toHaveProperty('id');
  });
});
