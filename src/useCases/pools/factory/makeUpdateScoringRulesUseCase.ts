import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { UpdateScoringRulesUseCase } from '../updateScoringRulesUseCase';

export function makeUpdateScoringRulesUseCase(): UpdateScoringRulesUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  return new UpdateScoringRulesUseCase(poolsRepository, usersRepository, poolAuthorizationService);
}
