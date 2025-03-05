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
  create(data: Prisma.UserCreateInput): Promise<User>;
}
