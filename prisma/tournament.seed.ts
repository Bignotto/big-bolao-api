import { PrismaClient, TournamentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTournament() {
  const worldCup = await prisma.tournament.create({
    data: {
      name: 'FIFA World Cup 2022',
      startDate: new Date('2022-11-20T00:00:00Z'),
      endDate: new Date('2022-12-18T00:00:00Z'),
      logoUrl:
        'https://digitalhub.fifa.com/transform/3a170d69-b0b5-4d0c-bca0-85880a60ea1a/World-Cup-logo',
      status: TournamentStatus.COMPLETED,
    },
  });

  console.log(`Created tournament: ${worldCup.name}`);

  return worldCup;
}

interface GroupAssignment {
  group: string;
  teams: string[];
}

export async function assignTeamsToTournament(
  tournamentId: number,
  teamMap: { [key: string]: number }
) {
  const groupAssignments: GroupAssignment[] = [
    { group: 'A', teams: ['Qatar', 'Ecuador', 'Senegal', 'Netherlands'] },
    { group: 'B', teams: ['England', 'Iran', 'USA', 'Wales'] },
    { group: 'C', teams: ['Argentina', 'Saudi Arabia', 'Mexico', 'Poland'] },
    { group: 'D', teams: ['France', 'Australia', 'Denmark', 'Tunisia'] },
    { group: 'E', teams: ['Spain', 'Costa Rica', 'Germany', 'Japan'] },
    { group: 'F', teams: ['Belgium', 'Canada', 'Morocco', 'Croatia'] },
    { group: 'G', teams: ['Brazil', 'Serbia', 'Switzerland', 'Cameroon'] },
    { group: 'H', teams: ['Portugal', 'Ghana', 'Uruguay', 'South Korea'] },
  ];

  for (const group of groupAssignments) {
    for (const teamName of group.teams) {
      await prisma.tournamentTeam.create({
        data: {
          tournamentId: tournamentId,
          teamId: teamMap[teamName],
          groupName: group.group,
        },
      });
      console.log(`Assigned ${teamName} to Group ${group.group}`);
    }
  }
}
