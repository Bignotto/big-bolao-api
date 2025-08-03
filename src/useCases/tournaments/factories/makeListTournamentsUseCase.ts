import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';

import { ListTournamentsUseCase } from '../listTournamentsUseCase';

export function makeListTournamentsUseCase(): ListTournamentsUseCase {
  const tournamentsRepository = new PrismaTournamentsRepository();
  const useCase = new ListTournamentsUseCase(tournamentsRepository);

  return useCase;
}
