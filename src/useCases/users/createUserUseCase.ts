import { AccountProvider } from '@prisma/client';
import { hash } from 'bcryptjs';
import { EmailInUseError } from '../../global/errors/EmailInUseError';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface ICreateUserRequest {
  fullName: string;
  email: string;
  passwordHash?: string;
  profileImageUrl?: string;
  accountProvider?: AccountProvider;
}

export class CreateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({
    email,
    passwordHash = '',
    fullName,
    profileImageUrl = '',
    accountProvider = 'EMAIL',
  }: ICreateUserRequest) {
    const userExists = await this.usersRepository.findByEmail(email);

    if (userExists) {
      throw new EmailInUseError(email);
    }

    const hashedPassword = await hash(passwordHash, 8);

    const user = await this.usersRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      profileImageUrl,
      accountProvider,
    });

    return user;
  }
}
