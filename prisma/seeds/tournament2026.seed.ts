import { PrismaClient, TournamentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTournament2026() {
  const worldCup = await prisma.tournament.create({
    data: {
      name: 'FIFA World Cup 2026',
      startDate: new Date('2026-06-11T00:00:00Z'),
      endDate: new Date('2026-07-19T00:00:00Z'),
      logoUrl:
        'https://digitalhub.fifa.com/transform/b60b9f85-c2aa-4f7f-b8b9-a2f4e2eab8e3/World-Cup-2026-logo',
      status: TournamentStatus.UPCOMING,
    },
  });

  console.log(`Created tournament: ${worldCup.name}`);

  return worldCup;
}

interface GroupAssignment {
  group: string;
  teams: string[];
}

export async function assignTeams2026ToTournament(
  tournamentId: number,
  teamMap: { [key: string]: number }
) {
  // Groups from December 5, 2025 FIFA World Cup 2026 draw
  // ⚠️ Group E 4th team uses placeholder — verify official data
  const groupAssignments: GroupAssignment[] = [
    { group: 'A', teams: ['Mexico', 'South Korea', 'South Africa', 'UEFA Playoff D Winner'] },
    { group: 'B', teams: ['Canada', 'Switzerland', 'Qatar', 'UEFA Playoff A Winner'] },
    { group: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Curaçao'] },
    { group: 'D', teams: ['United States', 'Paraguay', 'Australia', 'UEFA Playoff C Winner'] },
    { group: 'E', teams: ['Germany', 'Côte d\'Ivoire', 'Ecuador', 'TBD Group E'] },
    { group: 'F', teams: ['Netherlands', 'Japan', 'Tunisia', 'UEFA Playoff B Winner'] },
    { group: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'] },
    { group: 'H', teams: ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'] },
    { group: 'I', teams: ['France', 'Senegal', 'Norway', 'Inter-Confederation Playoff 2 Winner'] },
    { group: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
    { group: 'K', teams: ['Portugal', 'Colombia', 'Uzbekistan', 'Inter-Confederation Playoff 1 Winner'] },
    { group: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
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
