import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { GetUserPoolsUseCase } from '../getUserPoolsUseCase';

export function makeGetUserPoolsUseCase(): GetUserPoolsUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new GetUserPoolsUseCase(poolsRepository, usersRepository);
  return useCase;
}
