import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

interface IGetPoolRequest {
  poolId: number;
  userId: string; // User requesting the pool info (for authorization checks if needed)
}

export class GetPoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository
  ) {}

  async execute({ poolId, userId }: IGetPoolRequest) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    console.log('Pool:', pool);

    // const participants = await this.poolsRepository.getPoolParticipants(poolId);

    // const scoringRules = await this.poolsRepository.getScoringRules(poolId);
    // if (!scoringRules) {
    //   throw new ResourceNotFoundError('Scoring rules not found for this pool');
    // }

    // const participantsDetails = await Promise.all(
    //   participants.map(async (participant) => {
    //     const userDetails = await this.usersRepository.findById(participant.userId);
    //     return {
    //       id: userDetails?.id,
    //       fullName: userDetails?.fullName,
    //       profileImageUrl: userDetails?.profileImageUrl,
    //     };
    //   })
    // );

    // Return combined pool information
    //NEXT: Fix how get pool will return the pool information
    return pool;
  }
}
