import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { AccountProvider, AccountRole, User } from '@prisma/client';

export async function createUser(
  repository: IUsersRepository,
  data: {
    fullName?: string;
    email?: string;
    passwordHash?: string;
    accountProvider?: AccountProvider;
    profileImageUrl?: string;
    role?: AccountRole;
  }
): Promise<User> {
  const user = await repository.create({
    fullName: data.fullName ?? faker.person.fullName(),
    email: data.email ?? faker.internet.email(),
    passwordHash: data.passwordHash ?? 'hashed_password_' + Math.random().toString(36).slice(2, 10),
    accountProvider: data.accountProvider ?? AccountProvider.EMAIL,
    profileImageUrl: data.profileImageUrl ?? faker.image.avatar(),
    role: data.role ?? AccountRole.USER,
  });
  return user;
}
