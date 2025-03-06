import { Prisma, User } from '@prisma/client';
import { IUsersRepository } from './IUsersRepository';

export class InMemoryUsersRepository implements IUsersRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((user) => user.email === email);
    return user || null;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = {
      id: `${this.users.length + 1}`,
      email: data.email,
      passwordHash: data.passwordHash ?? '',
      fullName: data.fullName,
      profileImageUrl: data.profileImageUrl ?? '',
      createdAt: new Date(),
      lastLogin: new Date(),
      accountId: `${this.users.length + 1}`,
      accountProvider: data.accountProvider ?? 'EMAIL',
    };

    this.users.push(user);
    return user;
  }
}
