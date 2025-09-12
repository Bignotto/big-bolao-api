import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';

import { GetTournamentDetailUseCase } from '../getTournamentDetailUseCase';

export function makeGetTournamentDetailUseCase(): GetTournamentDetailUseCase {
  const tournamentsRepository = new PrismaTournamentsRepository();
  return new GetTournamentDetailUseCase(tournamentsRepository);
}

