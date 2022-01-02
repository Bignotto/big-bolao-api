import { ICreateGroupDTO } from '../dtos/ICreateGroupDTO';
import { Group } from '../entities/Group';

interface IGroupRepository {
  create(data: ICreateGroupDTO): Promise<Group>;
}

export { IGroupRepository };
