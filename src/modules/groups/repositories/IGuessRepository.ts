import { ICreateGuessDTO } from '../dtos/ICreateGuessDTO';
import { Guess } from '../entities/Guess';

interface IGuessRepository {
  create(data: ICreateGuessDTO): Promise<Guess>;
}

export { IGuessRepository };
