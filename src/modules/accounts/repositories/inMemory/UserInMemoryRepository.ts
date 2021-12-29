import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserInMemoryRepository implements IUserRepository {
  users: User[] = [];

  list(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

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

  findByEmail(email: string): Promise<User> {
    const found = this.users.find(u => u.email === email);
    return Promise.resolve(found);
  }
}

export { UserInMemoryRepository };
