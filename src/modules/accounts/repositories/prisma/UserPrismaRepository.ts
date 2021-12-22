import { PrismaClient } from '@prisma/client';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserPrismaRepository implements IUserRepository {
  async create({
    name,
    email,
    password,
    avatar,
    favTeam,
    profile,
  }: ICreateUserDTO): Promise<User> {
    const prisma = new PrismaClient();

    const newUser = new User();
    Object.assign(newUser, { name, email, password, avatar, favTeam, profile });
    let createdUser: User;

    try {
      createdUser = await prisma.user.create({ data: newUser });
    } catch (error) {
      console.log({ error });
      throw new Error('CreateUserRepository Database Error');
    } finally {
      prisma.$disconnect();
    }
    return createdUser;
  }
}

export { UserPrismaRepository };
