import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

interface IGetUserInfoRequest {
  userId: string;
}

export class GetUserInfoUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ userId }: IGetUserInfoRequest): Promise<import('@prisma/client').User> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError(userId);
    }

    return user;
  }
}
