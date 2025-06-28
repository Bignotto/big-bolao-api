import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { Tournament } from '@prisma/client';

interface ListTournamentsUseCaseResponse {
  tournaments: Tournament[];
}

export class ListTournamentsUseCase {
  constructor(private tournamentsRepository: ITournamentsRepository) {}

  async execute(): Promise<ListTournamentsUseCaseResponse> {
    const tournaments = await this.tournamentsRepository.list();

    return { tournaments };
  }
}
