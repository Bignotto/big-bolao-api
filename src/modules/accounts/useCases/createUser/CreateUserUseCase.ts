import { AppError } from '@shared/errors/AppError';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { IUserRepository } from '../../repositories/IUserRepository';
import { UserMap } from '@modules/accounts/mapper/UserMap';

import { hash } from 'bcryptjs';

import { inject, injectable } from 'tsyringe';
import { IUserResponseDTO } from '@modules/accounts/dtos/UserResponseDTO';

@injectable()
class CreateUserUseCase {
  constructor(
    @inject('UsersRepository') private usersRepository: IUserRepository,
  ) {}

  async execute({
    name,
    email,
    password,
    favTeam,
    profile,
    avatar,
  }: ICreateUserDTO): Promise<IUserResponseDTO> {
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
    const user = UserMap.toDto(newUser);
    return user;
  }
}

export { CreateUserUseCase };
