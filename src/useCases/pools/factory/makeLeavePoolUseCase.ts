import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { LeavePoolUseCase } from '../leavePoolUseCase';

export function makeLeavePoolUseCase() {
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();
  const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
  const leavePoolUseCase = new LeavePoolUseCase(
    poolsRepository,
    usersRepository,
    poolAuthorizationService
  );
  return leavePoolUseCase;
}
