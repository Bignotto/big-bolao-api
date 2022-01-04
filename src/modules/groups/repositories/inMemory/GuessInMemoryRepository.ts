import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';
import { Guess } from '@modules/groups/entities/Guess';
import { IGuessRepository } from '../IGuessRepository';

class GuessInMemoryRepository implements IGuessRepository {
  guesses: Guess[] = [];

  create({
    id,
    user_id,
    group_id,
    match_id,
    home_team,
    away_team,
  }: ICreateGuessDTO): Promise<Guess> {
    const guess = new Guess();
    Object.assign(guess, {
      id,
      user_id,
      group_id,
      match_id,
      home_team,
      away_team,
    });
    this.guesses.push(guess);
    return Promise.resolve(guess);
  }
}

export { GuessInMemoryRepository };
