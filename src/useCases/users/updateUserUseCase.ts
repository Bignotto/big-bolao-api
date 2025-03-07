import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

interface IUpdateUserRequest {
  userId: string;
  fullName?: string;
  email?: string;
  profileImageUrl?: string;
}

export class UpdateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ userId, email, fullName, profileImageUrl }: IUpdateUserRequest) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError(userId);
    }

    const updatedData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(profileImageUrl && { profileImageUrl }),
    };

    const updatedUser = await this.usersRepository.update(userId, updatedData);

    return updatedUser;
  }
}
//NEXT: implement the controller and route for the updateUserUseCase
