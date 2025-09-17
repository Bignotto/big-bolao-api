import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

interface IGetUserPoolsRequest {
  userId: string;
}

export class GetUserPoolsUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ userId }: IGetUserPoolsRequest): Promise<{ pools: import('@prisma/client').Pool[] }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Get pools where the user is a participant or creator
    const pools = await this.poolsRepository.findByParticipantId(userId);

    return {
      pools,
    };
  }
}
