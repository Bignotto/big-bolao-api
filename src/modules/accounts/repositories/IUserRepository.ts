import { ICreateUserDTO } from '../dtos/CreateUserDTO';
import { User } from '../entities/User';

interface IUserRepository {
  create(data: ICreateUserDTO): Promise<User>;
  findByEmail(email: string): Promise<User>;
  list(): Promise<User[]>;
}

export { IUserRepository };
