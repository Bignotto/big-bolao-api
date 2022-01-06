import { ICreateMatchDTO } from '../dtos/ICreateMatchDto';
import { IMatchResultDTO } from '../dtos/IMatchResultDTO';
import { Match } from '../entities/Match';

interface IMatchRepository {
  create(data: ICreateMatchDTO): Promise<Match>;
  findById(match_id: number): Promise<Match>;
  listAll(): Promise<Match[]>;
  updateMatch(data: IMatchResultDTO): Promise<Match>;
}

export { IMatchRepository };
