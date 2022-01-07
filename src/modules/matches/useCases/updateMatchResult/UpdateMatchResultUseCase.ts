import { inject, injectable } from 'tsyringe';

import { IMatchRepository } from '../../repositories/IMatchRepository';

import { Match } from '@modules/matches/entities/Match';
import { IMatchResultDTO } from '@modules/matches/dtos/IMatchResultDTO';

@injectable()
class UpdateMatchResultUseCase {
  constructor(
    @inject('MatchRepository') private matchRepository: IMatchRepository,
  ) {}

  async execute({
    match_id,
    home_team_score,
    away_team_score,
  }: IMatchResultDTO): Promise<Match> {
    const result = await this.matchRepository.updateMatch({
      match_id,
      home_team_score,
      away_team_score,
    });

    return result;
  }
}

export { UpdateMatchResultUseCase };
