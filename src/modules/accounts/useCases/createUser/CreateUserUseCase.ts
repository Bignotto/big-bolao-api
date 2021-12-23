import { User } from '.prisma/client';
import { AppError } from '../../../../shared/errors/AppError';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { IUserRepository } from '../../repositories/IUserRepository';

class CreateUserUseCase {
  constructor(private usersRepository: IUserRepository) {}

  async execute({
    name,
    email,
    password,
    favTeam,
    profile,
    avatar,
  }: ICreateUserDTO): Promise<User> {
    const foundEmail = await this.usersRepository.findByEmail(email);
    if (foundEmail) throw new AppError('E-Mail address already taken.', 400);

    const newUser = await this.usersRepository.create({
      name,
      email,
      password,
      favTeam,
      profile,
      avatar,
    });
    return newUser;
  }
}

export { CreateUserUseCase };
