import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { GetUserPoolStandingUseCase } from '../getUserPoolsStandingsUseCase';

export function makeGetUserPoolStandingUseCase(): GetUserPoolStandingUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();

  const getUserPoolStandingUseCase = new GetUserPoolStandingUseCase(
    poolsRepository,
    usersRepository
  );

  return getUserPoolStandingUseCase;
}
