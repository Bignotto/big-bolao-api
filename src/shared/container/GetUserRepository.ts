import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';
import { inject, injectable } from 'tsyringe';

@injectable()
class GetUserRepository {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUserRepository,
  ) {}

  getRepository(): IUserRepository {
    return this.usersRepository;
  }
}

export { GetUserRepository };
