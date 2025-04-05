import { fakerPT_BR as faker } from '@faker-js/faker';
import { Tournament, TournamentStatus } from '@prisma/client';

export async function createTournament(data: {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  logoUrl?: string;
  status?: TournamentStatus;
}): Promise<Tournament> {
  const randomTournamentNumber = Math.floor(Math.random() * 100);
  return {
    id: randomTournamentNumber,
    name: data.name ?? `Tournament ${faker.lorem.slug(2)}`,
    startDate: data.startDate ?? new Date(),
    endDate: data.endDate ?? new Date(),
    logoUrl: data.logoUrl ?? faker.image.url(),
    status: data.status ?? TournamentStatus.UPCOMING,
  } as Tournament;
}
