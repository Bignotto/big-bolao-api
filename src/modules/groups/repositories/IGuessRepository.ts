import { ICreateGuessDTO } from '../dtos/ICreateGuessDTO';
import { Guess } from '../entities/Guess';

interface IGroupMatchUser {
  group_id: string;
  match_id: number;
  user_id: string;
}

interface IGuessRepository {
  create(data: ICreateGuessDTO): Promise<Guess>;
  findByUserId(user_id: string): Promise<Guess[]>;
  findByGroupMatchUser(data: IGroupMatchUser): Promise<Guess>;
}

export { IGuessRepository, IGroupMatchUser };
