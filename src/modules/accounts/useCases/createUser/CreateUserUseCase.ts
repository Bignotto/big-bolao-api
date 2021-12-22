import { User } from '.prisma/client';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { IUserRepository } from '../../repositories/IUserRepository';

class CreateUserUseCase {
  constructor(private usersRepository: IUserRepository) {}

  async execute(data: ICreateUserDTO): Promise<User> {
    const newUser = await this.usersRepository.create(data);
    return newUser;
  }
}

export { CreateUserUseCase };
