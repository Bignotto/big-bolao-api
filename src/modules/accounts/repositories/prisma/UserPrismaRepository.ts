import { PrismaClient } from '@prisma/client';
import { ICreateUserDTO } from '../../dtos/CreateUserDTO';
import { User } from '../../entities/User';
import { IUserRepository } from '../IUserRepository';

class UserPrismaRepository implements IUserRepository {
  findByEmail(email: string): Promise<User> {
    throw new Error('Method not implemented.');
  }
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

    const createdUser = await prisma.user.create({ data: newUser });

    prisma.$disconnect();

    return createdUser;
  }
}

export { UserPrismaRepository };
