import { ICreateGroupDTO } from '../dtos/ICreateGroupDTO';
import { Group } from '../entities/Group';

interface IGropupRepository {
  create(data: ICreateGroupDTO): Promise<Group>;
}

export { IGropupRepository };
