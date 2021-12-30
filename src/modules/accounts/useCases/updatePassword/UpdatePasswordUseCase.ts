import { inject, injectable } from 'tsyringe';
import { compare, hash } from 'bcryptjs';

import { AppError } from '@shared/errors/AppError';
import { UserMap } from '@modules/accounts/mapper/UserMap';

import { IUserRepository } from '../../repositories/IUserRepository';
import { IUserResponseDTO } from '@modules/accounts/dtos/UserResponseDTO';

interface IRequest {
  password: string;
  newPassword: string;
  userId: string;
}
@injectable()
class UpdatePasswordUseCase {
  constructor(
    @inject('UsersRepository') private userRepository: IUserRepository,
  ) {}

  async execute({
    password,
    newPassword,
    userId,
  }: IRequest): Promise<IUserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('Wrong credentials', 404);

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) throw new AppError('Wrong credentials', 401);

    const hashedPassword = await hash(newPassword, 8);
    user.password = hashedPassword;

    const updatedUser = await this.userRepository.create(user);
    return UserMap.toDto(updatedUser);
  }
}

export { UpdatePasswordUseCase };
