import { User } from '../../entities/User';
import { AppError } from '@shared/errors/AppError';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { IUserRepository } from '../../repositories/IUserRepository';

import { hash } from 'bcryptjs';

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
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
      throw new AppError('E-Mail address is invalid.', 400);

    const foundEmail = await this.usersRepository.findByEmail(email);
    if (foundEmail) throw new AppError('E-Mail address already taken.', 400);

    if (password.length < 6)
      throw new AppError('Password must have at least 6 characters.', 400);

    const hashedPassword = await hash(password, 8);

    const newUser = await this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      favTeam,
      profile,
      avatar,
    });
    return newUser;
  }
}

export { CreateUserUseCase };
