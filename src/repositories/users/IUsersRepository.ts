import { Prisma, User } from '@prisma/client';

interface ICreateUserDTO {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  profileImageUrl: string;
}

export interface IUsersRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
