import { fakerPT_BR as faker } from '@faker-js/faker';
import { Team } from '@prisma/client';

export async function createTeam(data: {
  name?: string;
  countryCode?: string;
  flagUrl?: string;
}): Promise<Team> {
  const randomTeamNumber = Math.floor(Math.random() * 100);
  return {
    id: randomTeamNumber,
    name: data.name ?? `Team ${randomTeamNumber}`,
    countryCode: data.countryCode ?? faker.location.countryCode(),
    flagUrl: data.flagUrl ?? 'https://example.com/flag.png',
  } as Team;
}
