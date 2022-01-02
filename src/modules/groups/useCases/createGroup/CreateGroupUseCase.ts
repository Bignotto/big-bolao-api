import { inject, injectable } from 'tsyringe';

import { IGroupRepository } from '../../repositories/IGroupRepository';

import { Group } from '@modules/groups/entities/Group';
import { ICreateGroupDTO } from '@modules/groups/dtos/ICreateGroupDTO';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';
import { AppError } from '@shared/errors/AppError';

@injectable()
class CreateGroupUseCase {
  constructor(
    @inject('GroupRepository') private groupRepository: IGroupRepository,
    @inject('UsersRepository') private userRepository: IUserRepository,
  ) {}

  async execute({
    description,
    owner_id,
    password,
    users,
  }: ICreateGroupDTO): Promise<Group> {
    const owner = await this.userRepository.findById(owner_id);
    if (!owner) throw new AppError('Invalid user', 400);

    if (!users) users.push(owner);

    const group = await this.groupRepository.create({
      description,
      owner_id,
      password,
      users,
    });

    return group;
  }
}

export { CreateGroupUseCase };
