import 'reflect-metadata';
import { CreateGuessUseCase } from './CreateGuessUseCase';
import { GuessInMemoryRepository } from '@modules/groups/repositories/inMemory/GuessInMemoryRepository';

import { UserInMemoryRepository } from '@modules/accounts/repositories/inMemory/UserInMemoryRepository';

import { GroupInMemoryRepository } from '@modules/groups/repositories/inMemory/GroupInMemoryRepository';

import { AppError } from '@shared/errors/AppError';

let createGuessUseCase: CreateGuessUseCase;
let guessRepository: GuessInMemoryRepository;

let groupRepository: GroupInMemoryRepository;

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
  });

  it('should be able to register a new guess', async () => {
    const user = await userRepository.create({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    const group = await groupRepository.create({
      description: 'test group',
      owner_id: user.id,
      password: '123',
    });

    const createdGuess = await createGuessUseCase.execute({
      user_id: user.id,
      group_id: group.id,
      match_id: 7,
      home_team: 1,
      away_team: 0,
    });

    expect(createdGuess).toHaveProperty('id');
  });

  it('should not be able to register guess with invalid user', async () => {
    expect(() =>
      createGuessUseCase.execute({
        user_id: 'some user id',
        group_id: 'some group',
        match_id: 7,
        home_team: 1,
        away_team: 0,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should not be able to register guess with invalid group', async () => {
    const user = await userRepository.create({
      name: 'Test User',
      email: 'test@server.com',
      password: '123456',
    });

    expect(() =>
      createGuessUseCase.execute({
        user_id: user.id,
        group_id: 'some group',
        match_id: 7,
        home_team: 1,
        away_team: 0,
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
