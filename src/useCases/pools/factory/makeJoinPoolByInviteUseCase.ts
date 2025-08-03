import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

import { JoinPoolByInviteUseCase } from '../joinPoolByInviteUseCase';

export function makeJoinPoolByInviteUseCase(): JoinPoolByInviteUseCase {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const useCase = new JoinPoolByInviteUseCase(poolsRepository, usersRepository);

  return useCase;
}
