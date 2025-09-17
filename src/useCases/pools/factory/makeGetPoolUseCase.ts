import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { GetPoolUseCase } from '../getPoolUseCase';

export function makeGetPoolUseCase(): GetPoolUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();

  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);

  const getPoolUseCase = new GetPoolUseCase(
    poolsRepository,
    usersRepository,
    tournamentsRepository,
    poolAuthorizationService
  );

  return getPoolUseCase;
}
