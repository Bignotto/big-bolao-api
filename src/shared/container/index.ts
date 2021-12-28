import { container } from 'tsyringe';

import { UserTypeOrmRepository } from '@modules/accounts/repositories/typeorm/UserTypeOrmRepository';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';

container.registerSingleton<IUserRepository>(
  'UsersRepository',
  UserTypeOrmRepository,
);
