import { getRepository, Repository } from 'typeorm';

import { ICreateGroupDTO } from '@modules/groups/dtos/ICreateGroupDTO';
import { Group } from '@modules/groups/entities/Group';
import { IGropupRepository } from '../IGroupRepository';

class GroupTypeOrmRepository implements IGropupRepository {
  private repository: Repository<Group>;

  constructor() {
    this.repository = getRepository(Group);
  }

  async create({
    id,
    description,
    owner_id,
    password,
    users,
  }: ICreateGroupDTO): Promise<Group> {
    const newGroup = await this.repository.create({
      id,
      description,
      owner_id,
      password,
      users,
    });

    await this.repository.save(newGroup);

    return newGroup;
  }
}
