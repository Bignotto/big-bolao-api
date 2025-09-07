import { PrismaClient } from '@prisma/client';
import { createGroupMatches } from './seeds/groupMatches.seed';
import { createKnockoutMatches } from './seeds/knockoutMatches.seed';
import { seedPredictions } from './seeds/predictions.seed';
import { seedTeams } from './seeds/teams.seed';
import { assignTeamsToTournament, seedTournament } from './seeds/tournament.seed';
import { seedUsers } from './seeds/users.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create the World Cup tournament
  const worldCup = await seedTournament();

  // Create teams and map them for easy reference
  const teams = await seedTeams();
  const teamMap = teams.reduce((acc: { [key: string]: number }, team) => {
    acc[team.name] = team.id;
    return acc;
  }, {});

  // Create users
  await seedUsers();

  // Assign teams to the tournament with their groups
  await assignTeamsToTournament(worldCup.id, teamMap);

  // Create group stage matches
  await createGroupMatches(worldCup.id, teamMap);

  // Create knockout stage matches
  await createKnockoutMatches(worldCup.id, teamMap);

  // Create sample predictions
  await seedPredictions();

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
