import { ICreateGroupDTO } from '@modules/groups/dtos/ICreateGroupDTO';
import { Group } from '@modules/groups/entities/Group';
import { IGroupRepository } from '../IGroupRepository';

class GroupInMemoryRepository implements IGroupRepository {
  groups: Group[] = [];

  create({
    id,
    description,
    owner_id,
    password,
    users,
  }: ICreateGroupDTO): Promise<Group> {
    const group = new Group();
    Object.assign(group, {
      id,
      description,
      owner_id,
      password,
      users,
    });
    this.groups.push(group);
    return Promise.resolve(group);
  }
}

export { GroupInMemoryRepository };
