import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { JoinPoolByIdUseCase } from '../joinPoolByIdUseCase';

export function makeJoinPoolByIdUseCase(): JoinPoolByIdUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new JoinPoolByIdUseCase(poolsRepository, usersRepository);

  return useCase;
}
