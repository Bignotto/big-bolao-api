import { PrismaClient } from '@prisma/client';
import { createGroupMatches } from './seeds/groupMatches.seed';
import { createKnockoutMatches } from './seeds/knockoutMatches.seed';
import { seedPredictions } from './seeds/predictions.seed';
import { seedTeams } from './seeds/teams.seed';
import { assignTeamsToTournament, seedTournament } from './seeds/tournament.seed';
import { seedUsers } from './seeds/users.seed';
import { createGroupMatches2026 } from './seeds/groupMatches2026.seed';
import { createKnockoutMatches2026 } from './seeds/knockoutMatches2026.seed';
import { seedTeams2026 } from './seeds/teams2026.seed';
import { assignTeams2026ToTournament, seedTournament2026 } from './seeds/tournament2026.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ── FIFA World Cup 2022 (historical data) ────────────────────────────────
  const worldCup = await seedTournament();

  const teams = await seedTeams();
  const teamMap = teams.reduce((acc: { [key: string]: number }, team) => {
    acc[team.name] = team.id;
    return acc;
  }, {});

  await seedUsers();
  await assignTeamsToTournament(worldCup.id, teamMap);
  await createGroupMatches(worldCup.id, teamMap);
  await createKnockoutMatches(worldCup.id, teamMap);
  await seedPredictions();

  // ── FIFA World Cup 2026 ──────────────────────────────────────────────────
  console.log('\nSeeding 2026 World Cup data...');

  const worldCup2026 = await seedTournament2026();

  const teams2026 = await seedTeams2026();
  const teamMap2026 = teams2026.reduce((acc: { [key: string]: number }, team) => {
    acc[team.name] = team.id;
    return acc;
  }, {});

  await assignTeams2026ToTournament(worldCup2026.id, teamMap2026);
  await createGroupMatches2026(worldCup2026.id, teamMap2026);
  await createKnockoutMatches2026(worldCup2026.id, teamMap2026);

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
