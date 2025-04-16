import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

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

// Utility function to generate a secure random password hash
function generatePasswordHash(): string {
  // In a real app, you would use bcrypt or similar to hash passwords
  // This is just a placeholder
  return `hash_${Math.random().toString(36).substring(2, 15)}`;
}

// Clean quotes from name strings
function cleanName(name: string): string {
  return name.replace(/^"/, '').replace(/"$/, '').trim();
}

const prisma = new PrismaClient();

export async function seedUsers() {
  try {
    console.log('Starting seed process...');

    // Read the CSV file
    const csvFilePath = path.resolve(__dirname, './subsolo2_final_standings.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    // Parse the CSV content
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as StandingsRow[];

    console.log(`Found ${rows.length} rows in the CSV file.`);

    // Extract unique users to avoid duplicates
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
        // Clean the name and generate an email based on the full_name
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

    // Create all users in database
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

    // Optional: You could also create the pool and add the users as participants
    // based on the group_id and group_name in the CSV

    // First, let's check if we have a group to work with
    if (rows.length > 0) {
      const groupId = rows[0].group_id;
      const groupName = rows[0].group_name;

      if (groupId && groupName) {
        // Create a pool based on the group
        const pool = await prisma.pool.upsert({
          where: { id: parseInt(groupId, 10) || 1 }, // Fallback to id 1 if groupId can't be parsed
          update: {},
          create: {
            id: parseInt(groupId, 10) || 1, // Fallback to id 1 if groupId can't be parsed
            name: groupName.trim(),
            description: `Pool imported from ${groupName.trim()} standings`,
            tournamentId: 1, // You might want to adjust this to match your actual tournament
            creatorId: Array.from(uniqueUsers.values())[0].id, // Use the first user as creator
            createdAt: new Date(),
          },
        });

        console.log(`Created pool: ${pool.name} with ID: ${pool.id}`);

        // Add all users as participants
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

        // Create leaderboard entries
        const leaderboardPromises = rows.map((row) => {
          return prisma.leaderboard.upsert({
            where: {
              poolId_userId: {
                poolId: pool.id,
                userId: row.user_id,
              },
            },
            update: {},
            create: {
              poolId: pool.id,
              userId: row.user_id,
              totalPoints: parseInt(row.total_points, 10) || 0,
              exactScoresCount: parseInt(row.exact_matches, 10) || 0,
              correctWinnersCount: 0, // We don't have this data
              rank: parseInt(row.ranking, 10) || 0,
              lastUpdated: new Date(),
            },
          });
        });

        const leaderboardEntries = await Promise.all(leaderboardPromises);
        console.log(`Created ${leaderboardEntries.length} leaderboard entries`);
      }
    }
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
