import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';
import { Guess } from '@modules/groups/entities/Guess';
import { IGroupMatchUser, IGuessRepository } from '../IGuessRepository';

class GuessInMemoryRepository implements IGuessRepository {
  guesses: Guess[] = [];

  findByUserId(user_id: string): Promise<Guess[]> {
    const found = this.guesses.filter(g => g.user_id === user_id);
    return Promise.resolve(found);
  }

  findByGroupMatchUser({
    group_id,
    match_id,
    user_id,
  }: IGroupMatchUser): Promise<Guess> {
    const found = this.guesses.find(
      g =>
        g.user_id === user_id &&
        g.group_id === group_id &&
        g.match_id === match_id,
    );
    return Promise.resolve(found);
  }

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
