import { getRepository, Repository } from 'typeorm';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserTypeOrmRepository implements IUserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = getRepository(User);
  }

  async create({
    id,
    name,
    email,
    password,
    favTeam = '',
    profile = '',
    avatar = '',
  }: ICreateUserDTO): Promise<User> {
    const newUser = this.repository.create({
      id,
      name,
      email,
      password,
      favTeam,
      profile,
      avatar,
    });

    await this.repository.save(newUser);

    return newUser;
  }

  async findByEmail(email: string): Promise<User> {
    const found = await this.repository.findOne({
      email,
    });
    return found;
  }

  async list(): Promise<User[]> {
    const userList = await this.repository.find();
    return userList;
  }

  async findById(id: string): Promise<User> {
    const found = await this.repository.findByIds([id]);
    return found[0];
  }
}

export { UserTypeOrmRepository };
