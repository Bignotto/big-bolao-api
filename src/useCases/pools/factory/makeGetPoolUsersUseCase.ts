import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { GetPoolUsersUseCase } from '../getPoolUsersUseCase';

export function makeGetPoolUsersUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new GetPoolUsersUseCase(poolsRepository, usersRepository);

  return useCase;
}
