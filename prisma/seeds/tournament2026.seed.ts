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
  // Groups from the December 5, 2025 FIFA World Cup 2026 draw.
  // UEFA playoff winners confirmed March 31, 2026.
  // Inter-confederation playoff winners confirmed March 31, 2026.
  const groupAssignments: GroupAssignment[] = [
    { group: 'A', teams: ['México', 'Coreia do Sul', 'África do Sul', 'Tchéquia'] },
    { group: 'B', teams: ['Canadá', 'Bósnia e Herzegovina', 'Catar', 'Suíça'] },
    { group: 'C', teams: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'] },
    { group: 'D', teams: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'] },
    { group: 'E', teams: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'] },
    { group: 'F', teams: ['Holanda', 'Japão', 'Suécia', 'Tunísia'] },
    { group: 'G', teams: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'] },
    { group: 'H', teams: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'] },
    { group: 'I', teams: ['França', 'Senegal', 'Iraque', 'Noruega'] },
    { group: 'J', teams: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'] },
    { group: 'K', teams: ['Portugal', 'República Democrática do Congo', 'Uzbequistão', 'Colômbia'] },
    { group: 'L', teams: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'] },
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
