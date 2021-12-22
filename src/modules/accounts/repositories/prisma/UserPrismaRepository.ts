import { PrismaClient } from '@prisma/client';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserPrismaRepository implements IUserRepository {
  private prisma = new PrismaClient();

  async create({
    name,
    email,
    password,
    avatar,
    favTeam,
    profile,
  }: ICreateUserDTO): Promise<User> {
    const newUser = new User();
    Object.assign(newUser, { name, email, password, avatar, favTeam, profile });
    const createdUser = await this.prisma.user.create({ data: newUser });
    return createdUser;
  }
}

export { UserPrismaRepository };
