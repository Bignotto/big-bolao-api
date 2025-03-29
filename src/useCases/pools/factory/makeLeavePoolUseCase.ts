import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { LeavePoolUseCase } from '../leavePoolUseCase';

export function makeLeavePoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const leavePoolUseCase = new LeavePoolUseCase(poolsRepository, usersRepository);

  return leavePoolUseCase;
}
