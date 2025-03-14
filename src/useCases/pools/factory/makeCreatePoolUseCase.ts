import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { CreatePoolUseCase } from '../createPoolUseCase';

export function makeCreatePoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const tournamentsRepository = new PrismaTournamentsRepository();

  const useCase = new CreatePoolUseCase(poolsRepository, usersRepository, tournamentsRepository);

  return useCase;
}
