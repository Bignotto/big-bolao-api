import { CreateGuessUseCase } from './CreateGuessUseCase';
import { GuessInMemoryRepository } from '@modules/groups/repositories/inMemory/GuessInMemoryRepository';

import { User } from '@modules/accounts/entities/User';
import { UserInMemoryRepository } from '@modules/accounts/repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from '@modules/accounts/useCases/createUser/CreateUserUseCase';

import { GroupInMemoryRepository } from '@modules/groups/repositories/inMemory/GroupInMemoryRepository';
import { CreateGroupUseCase } from '../createGroup/CreateGroupUseCase';

import { AppError } from '@shared/errors/AppError';

let createGuessUseCase: CreateGuessUseCase;
let guessRepository: GuessInMemoryRepository;

let createGroupUseCase: CreateGroupUseCase;
let groupRepository: GroupInMemoryRepository;

let createUserUseCase: CreateUserUseCase;
let userRepository: UserInMemoryRepository;

describe('Create Guess Use Case', () => {
  beforeEach(() => {
    userRepository = new UserInMemoryRepository();
    guessRepository = new GuessInMemoryRepository();
    groupRepository = new GroupInMemoryRepository();

    createGuessUseCase = new CreateGuessUseCase(
      guessRepository,
      userRepository,
      groupRepository,
    );

    createUserUseCase = new CreateUserUseCase(userRepository);

    // createGroupUseCase = new CreateGroupUseCase(
    //   groupRepository,
    //   userRepository,
    // );
  });

  it('should be able to register a new guess', async () => {
    const user = await userRepository.create({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    const createdGuess = await createGuessUseCase.execute({
      user_id: user.id,
      group_id: 'some group',
      match_id: 7,
      home_team: 1,
      away_team: 0,
    });

    expect(createdGuess).toHaveProperty('id');
  });
});
