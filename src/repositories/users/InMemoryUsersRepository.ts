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

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((user) => user.id === id);
    return user || null;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const userIndex = this.users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const user: User = {
      id: this.users[userIndex].id,
      email: `${data.email ?? this.users[userIndex].email}`,
      passwordHash: this.users[userIndex].passwordHash,
      fullName: `${data.fullName ?? this.users[userIndex].fullName}`,
      profileImageUrl: `${data.profileImageUrl ?? this.users[userIndex].profileImageUrl}`,
      createdAt: this.users[userIndex].createdAt,
      lastLogin: new Date(),
      accountId: `${this.users[userIndex].accountId}`,
      accountProvider: this.users[userIndex].accountProvider,
    };

    this.users[userIndex] = user;

    return user;
  }
}
