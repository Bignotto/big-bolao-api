import { inject, injectable } from 'tsyringe';

import { IMatchRepository } from '../../repositories/IMatchRepository';

import { Match } from '@modules/matches/entities/Match';

@injectable()
class UpdateMatchResultUseCase {
  constructor(
    @inject('MatchRepository') private matchRepository: IMatchRepository,
  ) {}

  async execute(): Promise<Match> {
    const result = await this.matchRepository.updateMatch();

    return result;
  }
}

export { UpdateMatchResultUseCase };
