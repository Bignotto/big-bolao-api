import { AccountProvider } from '@prisma/client';
import { hash } from 'bcryptjs';
import { EmailInUseError } from '../../global/errors/EmailInUseError';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface ICreateUserRequest {
  id?: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  profileImageUrl?: string;
  accountProvider?: AccountProvider;
}

export class CreateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({
    id,
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
      id,
      email,
      passwordHash: hashedPassword,
      fullName,
      profileImageUrl,
      accountProvider,
    });

    return user;
  }
}
