import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolStandings } from '@/global/types/poolStandings';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

interface GetUserPoolStandingRequest {
  userId: string;
}

interface GetUserPoolStandingResponse {
  standing: PoolStandings[] | null;
}

export class GetUserPoolStandingUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ userId }: GetUserPoolStandingRequest): Promise<GetUserPoolStandingResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const standing = await this.poolsRepository.getUserPoolsStandings(userId);

    return { standing };
  }
}
