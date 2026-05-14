import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

export class DeleteUserUseCase {
  constructor(
    private usersRepository: IUsersRepository,
    private poolsRepository: IPoolsRepository
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError(userId);
    }

    const createdPools = await this.poolsRepository.findByCreatorId(userId);

    for (const pool of createdPools) {
      const participants = await this.poolsRepository.getPoolParticipants(pool.id);
      const otherParticipants = participants
        .filter((p) => p.id !== userId)
        .sort((a, b) => (a.joinedAt?.getTime() ?? Infinity) - (b.joinedAt?.getTime() ?? Infinity));

      if (otherParticipants.length > 0) {
        await this.poolsRepository.update(pool.id, {
          creator: { connect: { id: otherParticipants[0].id } },
        });
      } else {
        await this.poolsRepository.deletePoolById(pool.id);
      }
    }

    await this.usersRepository.delete(userId);
  }
}
