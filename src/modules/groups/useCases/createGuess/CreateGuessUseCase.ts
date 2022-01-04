import { inject, injectable } from 'tsyringe';

import { IGuessRepository } from '../../repositories/IGuessRepository';

import { Guess } from '@modules/groups/entities/Guess';
import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';

@injectable()
class CreateGuessUseCase {
  constructor(
    @inject('GuessRepository') private guessRepository: IGuessRepository,
  ) {}

  async execute({
    user_id,
    group_id,
    match_id,
    home_team,
    away_team,
  }: ICreateGuessDTO): Promise<Guess> {
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
