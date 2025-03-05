import { hash } from 'bcryptjs';
import { EmailInUseError } from '../../global/errors/EmailInUseError';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface ICreateUserRequest {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  profileImageUrl: string;
}

export class CreateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ username, email, passwordHash, fullName, profileImageUrl }: ICreateUserRequest) {
    const userExists = await this.usersRepository.findByEmail(email);

    if (userExists) {
      throw new EmailInUseError(email);
    }

    const hashedPassword = await hash(passwordHash, 8);

    const user = await this.usersRepository.create({
      username,
      email,
      passwordHash: hashedPassword,
      fullName,
      profileImageUrl,
    });

    return user;
  }
}
