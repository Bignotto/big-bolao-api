import { inject, injectable } from 'tsyringe';

import { IGuessRepository } from '../../repositories/IGuessRepository';

import { Guess } from '@modules/groups/entities/Guess';
import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';
import { IUserRepository } from '@modules/accounts/repositories/IUserRepository';
import { AppError } from '@shared/errors/AppError';
import { IGroupRepository } from '@modules/groups/repositories/IGroupRepository';

@injectable()
class CreateGuessUseCase {
  constructor(
    @inject('GuessRepository') private guessRepository: IGuessRepository,
    @inject('UsersRepository') private usersRepository: IUserRepository,
    @inject('GroupRepository') private groupRepository: IGroupRepository,
  ) {}

  async execute({
    user_id,
    group_id,
    match_id,
    home_team,
    away_team,
  }: ICreateGuessDTO): Promise<Guess> {
    const user = await this.usersRepository.findById(user_id);
    if (!user)
      throw new AppError("Can't register guess with invalid user.", 401);

    const group = await this.groupRepository.findById(group_id);
    if (!group)
      throw new AppError("Cant't register guess with invalid group.", 401);

    const newGuess = await this.guessRepository.create({
      user_id,
      group_id,
      match_id,
      home_team,
      away_team,
    });
    return newGuess;
  }
}

export { CreateGuessUseCase };
