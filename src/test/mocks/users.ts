import { AccountProvider, AccountRole, User } from '@prisma/client';

export async function createUser(data: {
  fullName?: string;
  email?: string;
  passwordHash?: string;
  accountProvider?: AccountProvider;
  profileImageUrl?: string;
  role?: AccountRole;
}): Promise<User> {
  return {
    id: Math.random().toString(),
    fullName: data.fullName ?? `Test User ${Math.random().toString(36).slice(2, 7)}`,
    email: data.email ?? `test-${Math.random().toString(36).slice(2, 7)}@example.com`,
    passwordHash: data.passwordHash ?? 'hashed_password_' + Math.random().toString(36).slice(2, 10),
    accountProvider: data.accountProvider ?? AccountProvider.EMAIL,
    profileImageUrl:
      data.profileImageUrl ??
      `https://example.com/avatar/${Math.random().toString(36).slice(2, 7)}.jpg`,
    role: data.role ?? AccountRole.USER,
    createdAt: new Date(),
    lastLogin: null,
    accountId: null,
  };
}
