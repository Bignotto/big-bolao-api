import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { Tournament, TournamentStatus } from '@prisma/client';

export async function createTournament(
  repository: ITournamentsRepository,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    logoUrl?: string;
    status?: TournamentStatus;
  }
): Promise<Tournament> {
  const randomTournamentNumber = Math.floor(Math.random() * 100);
  const tournament = await repository.create({
    name: data.name ?? `Tournament ${randomTournamentNumber}`,
    startDate: data.startDate ?? new Date(),
    endDate: data.endDate ?? new Date(),
    logoUrl: data.logoUrl ?? faker.image.url(),
    status: data.status ?? TournamentStatus.UPCOMING,
  });

  return tournament;
}
