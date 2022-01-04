import { getRepository, Repository } from 'typeorm';

import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';
import { Guess } from '@modules/groups/entities/Guess';
import { IGuessRepository } from '../IGuessRepository';

class GuessTypeOrmRepository implements IGuessRepository {
  private repository: Repository<Guess>;

  constructor() {
    this.repository = getRepository(Guess);
  }

  async create({
    id,
    user_id,
    group_id,
    match_id,
    home_team,
    away_team,
  }: ICreateGuessDTO): Promise<Guess> {
    const newGuess = await this.repository.create({
      id,
      user_id,
      group_id,
      match_id,
      home_team,
      away_team,
    });

    await this.repository.save(newGuess);

    return newGuess;
  }
}

export { GuessTypeOrmRepository };
