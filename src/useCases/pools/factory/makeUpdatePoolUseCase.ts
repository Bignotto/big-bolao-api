import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { UpdatePoolUseCase } from '../updatePoolUseCase';

export function makeUpdatePoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  const useCase = new UpdatePoolUseCase(poolsRepository, usersRepository, poolAuthorizationService);

  return useCase;
}
