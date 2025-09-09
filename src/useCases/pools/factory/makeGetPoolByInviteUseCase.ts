import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';

import { GetPoolByInviteUseCase } from '../getPoolByInviteUseCase';

export function makeGetPoolByInviteUseCase(): GetPoolByInviteUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();
  return new GetPoolByInviteUseCase(poolsRepository, tournamentsRepository);
}
