import { Prisma, User } from '@prisma/client';

import { IUsersRepository } from './IUsersRepository';

export class InMemoryUsersRepository implements IUsersRepository {
  private users: User[] = [];

  findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((user) => user.email === email);
    return Promise.resolve(user || null);
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
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
    return Promise.resolve(user);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((user) => user.id === id);
    return Promise.resolve(user || null);
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const userIndex = this.users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const current = this.users[userIndex];

    const resolveStringField = (
      value: string | Prisma.StringFieldUpdateOperationsInput | undefined,
      fallback: string
    ): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null && typeof value.set === 'string') {
        return value.set;
      }
      return fallback;
    };

    const resolveNullableStringField = (value: unknown, fallback: string): string => {
      if (typeof value === 'string') return value;
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'object' && value !== null && 'set' in value) {
        const v = (value as { set?: string | null }).set;
        if (typeof v === 'string') return v;
        return fallback;
      }
      return fallback;
    };

    const user: User = {
      id: current.id,
      email: resolveStringField(data.email, current.email),
      passwordHash: current.passwordHash,
      fullName: resolveStringField(data.fullName, current.fullName),
      profileImageUrl: resolveNullableStringField(data.profileImageUrl, current.profileImageUrl ?? ''),
      createdAt: current.createdAt,
      lastLogin: new Date(),
      accountId: `${current.accountId}`,
      accountProvider: current.accountProvider,
    };

    this.users[userIndex] = user;

    return Promise.resolve(user);
  }
}
