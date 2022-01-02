import { inject, injectable } from 'tsyringe';

import { IGroupRepository } from '../../repositories/IGroupRepository';

import { Group } from '@modules/groups/entities/Group';
import { ICreateGroupDTO } from '@modules/groups/dtos/ICreateGroupDTO';

@injectable()
class CreateGroupUseCase {
  constructor(
    @inject('GroupRepository') private groupRepository: IGroupRepository,
  ) {}

  async execute({
    description,
    owner_id,
    password,
    users,
  }: ICreateGroupDTO): Promise<Group> {
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
