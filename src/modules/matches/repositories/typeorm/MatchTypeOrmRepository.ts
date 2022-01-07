import { getRepository, Repository } from 'typeorm';
import { IMatchResultDTO } from '@modules/matches/dtos/IMatchResultDTO';
import { Match } from '@modules/matches/entities/Match';
import { IMatchRepository } from '../IMatchRepository';
import { ICreateMatchDTO } from '@modules/matches/dtos/ICreateMatchDto';

class MatchTypeOrmRepository implements IMatchRepository {
  private repository: Repository<Match>;

  constructor() {
    this.repository = getRepository(Match);
  }
  create(data: ICreateMatchDTO): Promise<Match> {
    throw new Error('Method not implemented.');
  }

  async findById(match_id: number): Promise<Match> {
    const found = await this.repository.findOne({ id: match_id });
    return found;
  }

  async listAll(): Promise<Match[]> {
    const matches = await this.repository.find();
    return matches;
  }
  updateMatch(data: IMatchResultDTO): Promise<Match> {
    throw new Error('Method not implemented.');
  }
}

export { MatchTypeOrmRepository };
