import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { UpdatePoolUseCase } from '../updatePoolUseCase';

export function makeUpdatePoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new UpdatePoolUseCase(poolsRepository, usersRepository);

  return useCase;
}
