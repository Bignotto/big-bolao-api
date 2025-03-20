import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { JoinPoolUseCase } from '../joinPoolUseCase';

export function makeJoinPoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new JoinPoolUseCase(poolsRepository, usersRepository);

  return useCase;
}
