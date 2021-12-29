import { IUserRepository } from '../../repositories/IUserRepository';
import { UserMap } from '@modules/accounts/mapper/UserMap';

import { inject, injectable } from 'tsyringe';
import { IUserResponseDTO } from '@modules/accounts/dtos/UserResponseDTO';

@injectable()
class ListUsersUseCase {
  constructor(
    @inject('UsersRepository') private usersRepository: IUserRepository,
  ) {}

  async execute(): Promise<IUserResponseDTO[]> {
    const users = await this.usersRepository.list();
    const mappedUsers = users.map(u => UserMap.toDto(u));

    return mappedUsers;
  }
}

export { ListUsersUseCase };
