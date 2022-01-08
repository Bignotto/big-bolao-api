import { getRepository, Repository } from 'typeorm';
import { IMatchResultDTO } from '@modules/matches/dtos/IMatchResultDTO';
import { Match } from '@modules/matches/entities/Match';
import { IMatchRepository } from '../IMatchRepository';
import { ICreateMatchDTO } from '@modules/matches/dtos/ICreateMatchDto';
import { Team } from '@modules/matches/entities/Team';

class MatchTypeOrmRepository implements IMatchRepository {
  private repository: Repository<Match>;

  constructor() {
    this.repository = getRepository(Match);
  }
  async create({
    id,
    description,
    home_team,
    away_team,
    match_date,
    match_location,
    match_stadium,
    home_team_score,
    away_team_score,
  }: ICreateMatchDTO): Promise<Match> {
    const newMatch = this.repository.create({
      id,
      description,
      home_team,
      away_team,
      match_date,
      match_location,
      match_stadium,
      home_team_score,
      away_team_score,
    });

    await this.repository.save(newMatch);

    return newMatch;
  }

  async findById(match_id: number): Promise<Match> {
    const found = await this.repository.findOne({ id: match_id });
    return found;
  }

  async listAll(): Promise<Match[]> {
    const matches = await this.repository.find();
    return matches;
  }
  async updateMatch({
    match_id,
    home_team_score,
    away_team_score,
  }: IMatchResultDTO): Promise<Match> {
    const updatedMatch = await this.create({
      id: match_id,
      home_team_score,
      away_team_score,
    });

    return updatedMatch;
  }
}

export { MatchTypeOrmRepository };
