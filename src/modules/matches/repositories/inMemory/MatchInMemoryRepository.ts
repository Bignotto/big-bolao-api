import { ICreateMatchDTO } from '@modules/matches/dtos/ICreateMatchDto';
import { IMatchResultDTO } from '@modules/matches/dtos/IMatchResultDTO';
import { Match } from '@modules/matches/entities/Match';
import { IMatchRepository } from '../IMatchRepository';

class MatchInMemoryRepository implements IMatchRepository {
  matches: Match[] = [];

  create({
    id,
    description,
    home_team,
    away_team,
    match_location,
    match_stadium,
    match_date,
    home_team_score,
    away_team_score,
  }: ICreateMatchDTO): Promise<Match> {
    const newMatch = new Match();
    Object.assign(newMatch, {
      id,
      description,
      home_team,
      away_team,
      match_location,
      match_stadium,
      match_date,
      home_team_score,
      away_team_score,
    });
    this.matches.push(newMatch);
    return Promise.resolve(newMatch);
  }

  findById(match_id: number): Promise<Match> {
    const found = this.matches.find(m => m.id === match_id);
    return Promise.resolve(found);
  }

  listAll(): Promise<Match[]> {
    return Promise.resolve(this.matches);
  }

  updateMatch(data: IMatchResultDTO): Promise<Match> {
    throw new Error('Method not implemented.');
  }
}

export { MatchInMemoryRepository };
