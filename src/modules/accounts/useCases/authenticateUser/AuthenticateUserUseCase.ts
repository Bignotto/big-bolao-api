import { compare } from 'bcryptjs';
import { AppError } from '@shared/errors/AppError';
import { IUserRepository } from '../../repositories/IUserRepository';

import { sign } from 'jsonwebtoken';
import auth from '@config/auth';
import { inject, injectable } from 'tsyringe';

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  user: {
    name: string;
    email: string;
  };
  token: string;
  // refresh_token: string;
}

@injectable()
class AuthenticateUserUseCase {
  constructor(
    @inject('UsersRepository') private usersRepository: IUserRepository,
  ) {}

  async execute({ email, password }: IRequest): Promise<IResponse> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new AppError('Wrong credentials', 401);

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) throw new AppError('Wrong credentials', 401);

    const token = sign({}, auth.secret, {
      subject: user.id,
      expiresIn: auth.expires_in,
    });

    return {
      user: {
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
}

export { AuthenticateUserUseCase };
