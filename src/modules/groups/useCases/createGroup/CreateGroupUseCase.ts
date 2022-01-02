import { inject, injectable } from 'tsyringe';

import { IGroupRepository } from '../../repositories/IGroupRepository';

import { Group } from '@modules/groups/entities/Group';
import { ICreateGroupDTO } from '@modules/groups/dtos/ICreateGroupDTO';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';

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

    const group = await this.groupRepository.create({
      description,
      owner_id,
      password,
      users: [owner],
    });

    return group;
  }
}

export { CreateGroupUseCase };
