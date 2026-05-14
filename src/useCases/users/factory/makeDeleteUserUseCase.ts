import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { DeleteUserUseCase } from '../deleteUserUseCase';

export function makeDeleteUserUseCase(): DeleteUserUseCase {
  const usersRepository = new PrismaUsersRepository();
  const poolsRepository = new PrismaPoolsRepository();

  return new DeleteUserUseCase(usersRepository, poolsRepository);
}
