import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserInMemoryRepository implements IUserRepository {
  users: User[] = [];

  create({
    email,
    name,
    password,
    favTeam,
    avatar,
    profile,
  }: ICreateUserDTO): Promise<User> {
    const user = new User();
    Object.assign(user, {
      email,
      name,
      password,
      favTeam,
      avatar,
      profile,
    });
    this.users.push(user);
    return Promise.resolve(user);
  }
}

export { UserInMemoryRepository };
