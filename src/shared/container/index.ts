import { container } from 'tsyringe';

import { UserTypeOrmRepository } from '@modules/accounts/repositories/typeorm/UserTypeOrmRepository';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';

import { GroupTypeOrmRepository } from '@modules/groups/repositories/typeorm/GroupTypeOrmRepository';
import { IGroupRepository } from '@modules/groups/repositories/IGroupRepository';

container.registerSingleton<IUserRepository>(
  'UsersRepository',
  UserTypeOrmRepository,
);

container.registerSingleton<IGroupRepository>(
  'GroupRepository',
  GroupTypeOrmRepository,
);
