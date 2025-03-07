import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { UpdateUserUseCase } from '../updateUserUseCase';

export function makeUpdateUserUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const updateUserUseCase = new UpdateUserUseCase(usersRepository);

  return updateUserUseCase;
}
