import { IMatchResultDTO } from '../dtos/IMatchResultDTO';
import { Match } from '../entities/Match';

interface IMatchRepository {
  findById(match_id: number): Promise<Match>;
  listAll(): Promise<Match[]>;
  updateMatch(data: IMatchResultDTO): Promise<Match>;
}

export { IMatchRepository };
