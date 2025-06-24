import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { GetPoolUsersUseCase } from '../getPoolUsersUseCase';

export function makeGetPoolUsersUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  const useCase = new GetPoolUsersUseCase(
    poolsRepository,
    usersRepository,
    poolAuthorizationService
  );

  return useCase;
}
