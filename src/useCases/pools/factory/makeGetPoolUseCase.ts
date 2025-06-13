import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { GetPoolUseCase } from '../getPoolUseCase';

export function makeGetPoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();

  const getPoolUseCase = new GetPoolUseCase(
    poolsRepository,
    usersRepository,
    tournamentsRepository
  );

  return getPoolUseCase;
}
