import { getRepository, Repository } from 'typeorm';

import { ICreateGuessDTO } from '@modules/groups/dtos/ICreateGuessDTO';
import { Guess } from '@modules/groups/entities/Guess';
import { IGroupMatchUser, IGuessRepository } from '../IGuessRepository';

class GuessTypeOrmRepository implements IGuessRepository {
  private repository: Repository<Guess>;

  constructor() {
    this.repository = getRepository(Guess);
  }

  async findByGroupMatchUser({
    group_id,
    match_id,
    user_id,
  }: IGroupMatchUser): Promise<Guess> {
    const found = await this.repository.findOne({
      user_id,
      group_id,
      match_id,
    });
    return found;
  }

  async findByUserId(user_id: string): Promise<Guess[]> {
    const guesses = await this.repository.find({
      user_id,
    });

    return guesses;
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
