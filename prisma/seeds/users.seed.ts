import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { seedScoringRules } from './scoringRules.seed';

interface StandingsRow {
  total_points: string;
  total_bonus: string;
  exact_matches: string;
  user_id: string;
  full_name: string;
  group_id: string;
  group_name: string;
  ranking: string;
  email: string;
}

function generatePasswordHash(): string {
  return `hash_${Math.random().toString(36).substring(2, 15)}`;
}

function cleanName(name: string): string {
  return name.replace(/^\"/, '').replace(/\"$/, '').trim();
}

const prisma = new PrismaClient();

// ESM-safe file path resolution
const resolveLocalPath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export async function seedUsers() {
  try {
    console.log('Starting seed process...');

    const csvFilePath = resolveLocalPath('../data/subsolo2_final_standings.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as StandingsRow[];

    console.log(`Found ${rows.length} rows in the CSV file.`);

    const uniqueUsers = new Map<
      string,
      {
        id: string;
        fullName: string;
        email: string;
        createdAt: Date;
        passwordHash: string;
      }
    >();

    rows.forEach((row) => {
      if (!uniqueUsers.has(row.user_id)) {
        const cleanedName = cleanName(row.full_name);

        uniqueUsers.set(row.user_id, {
          id: row.user_id,
          fullName: cleanedName,
          email: row.email,
          createdAt: new Date(), // We don't have created_at in this CSV, so use current date
          passwordHash: generatePasswordHash(),
        });
      }
    });

    console.log(`Found ${uniqueUsers.size} unique users to create.`);

    const userCreatePromises = Array.from(uniqueUsers.values()).map((user) => {
      console.log(`Creating user: ${user.fullName}`);
      return prisma.user.upsert({
        where: { id: user.id },
        update: {}, // No updates if already exists
        create: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          passwordHash: user.passwordHash,
          createdAt: user.createdAt,
        },
      });
    });

    const createdUsers = await Promise.all(userCreatePromises);
    console.log(`Successfully created ${createdUsers.length} users.`);

    // Check for existing pool info
    if (rows.length > 0) {
      const groupId = rows[0].group_id;
      const groupName = rows[0].group_name;

      if (groupId && groupName) {
        const pool = await prisma.pool.upsert({
          where: { id: parseInt(groupId, 10) || 1 }, // Fallback to id 1 if groupId can't be parsed
          update: {},
          create: {
            id: parseInt(groupId, 10) || 1, // Fallback to id 1 if groupId can't be parsed
            name: groupName.trim(),
            description: `Pool imported from ${groupName.trim()} standings`,
            tournamentId: 1,
            creatorId: Array.from(uniqueUsers.values())[0].id, // Assuming the first user is the creator
            createdAt: new Date(),
          },
        });

        console.log(`Created pool: ${pool.name} with ID: ${pool.id}`);

        await seedScoringRules(pool.id);
        console.log('Scoring rules seeded successfully.');

        const participantPromises = Array.from(uniqueUsers.keys()).map((userId) => {
          return prisma.poolParticipant.upsert({
            where: {
              poolId_userId: {
                poolId: pool.id,
                userId: userId,
              },
            },
            update: {},
            create: {
              poolId: pool.id,
              userId: userId,
              joinedAt: new Date(),
            },
          });
        });

        const participants = await Promise.all(participantPromises);
        console.log(`Added ${participants.length} participants to pool ${pool.name}`);
      }
    }
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

