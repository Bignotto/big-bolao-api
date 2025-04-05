import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { Team } from '@prisma/client';

export async function createTeam(
  repository: ITeamsRepository,
  data: {
    name?: string;
    countryCode?: string;
    flagUrl?: string;
  }
): Promise<Team> {
  const randomTeamNumber = Math.floor(Math.random() * 100);
  const team = await repository.create({
    name: data.name ?? `Team ${randomTeamNumber}`,
    countryCode: data.countryCode ?? faker.location.countryCode(),
    flagUrl: data.flagUrl ?? 'https://example.com/flag.png',
  });
  return team;
}
