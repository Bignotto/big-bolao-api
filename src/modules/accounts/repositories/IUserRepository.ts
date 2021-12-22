import { ICreateUserDTO } from '../dtos/CreateUserDTO';
import { User } from '../entities/User';

interface IUserRepository {
  create(data: ICreateUserDTO): Promise<User>;
}

export { IUserRepository };
