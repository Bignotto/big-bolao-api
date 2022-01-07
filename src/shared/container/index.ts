import { container } from 'tsyringe';

import { UserTypeOrmRepository } from '@modules/accounts/repositories/typeorm/UserTypeOrmRepository';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';

import { GroupTypeOrmRepository } from '@modules/groups/repositories/typeorm/GroupTypeOrmRepository';
import { IGroupRepository } from '@modules/groups/repositories/IGroupRepository';

import { GuessTypeOrmRepository } from '@modules/groups/repositories/typeorm/GuessTypeOrmRepository';
import { IGuessRepository } from '@modules/groups/repositories/IGuessRepository';
import { IMatchRepository } from '@modules/matches/repositories/IMatchRepository';
import { MatchTypeOrmRepository } from '@modules/matches/repositories/typeorm/MatchTypeOrmRepository';

container.registerSingleton<IUserRepository>(
  'UsersRepository',
  UserTypeOrmRepository,
);

container.registerSingleton<IGroupRepository>(
  'GroupRepository',
  GroupTypeOrmRepository,
);

container.registerSingleton<IGuessRepository>(
  'GuessRepository',
  GuessTypeOrmRepository,
);

container.registerSingleton<IMatchRepository>(
  'MatchRepository',
  MatchTypeOrmRepository,
);
