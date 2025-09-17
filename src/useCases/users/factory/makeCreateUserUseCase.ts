import { PrismaUsersRepository } from '../../../repositories/users/PrismaUsersRepository';
import { CreateUserUseCase } from '../createUserUseCase';

export function makeCreateUserUseCase(): CreateUserUseCase {
  const usersRepository = new PrismaUsersRepository();
  const createUserUseCase = new CreateUserUseCase(usersRepository);

  return createUserUseCase;
}
