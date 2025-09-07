import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe file path resolution
const resolveLocalPath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const prisma = new PrismaClient();

interface TeamRow {
  team_code: string;
  name: string;
  country_code: string;
  country_iso: string;
  flag: string;
  champion: string;
  continent: string;
  federation: string;
  group: string;
  fifa_ranking: string;
  fifa_points: string;
}

interface GuessRow {
  guess_id: string;
  group_id: string;
  match_id: string;
  user_id: string;
  home_team: string;
  home_team_score: string;
  away_team_score: string;
  away_team: string;
  predicted_home_score: string;
  predicted_away_score: string;
}

// Function to find match ID based on home and away team names
async function findMatchId(homeTeamName: string, awayTeamName: string) {
  try {
    // First, find the team IDs in the database
    const homeTeam = await prisma.team.findFirst({
      where: { name: { equals: homeTeamName, mode: 'insensitive' } },
    });

    const awayTeam = await prisma.team.findFirst({
      where: { name: { equals: awayTeamName, mode: 'insensitive' } },
    });

    if (!homeTeam || !awayTeam) {
      console.log(`Could not find teams ${homeTeamName} vs ${awayTeamName} in database`);
      return null;
    }

    // Then find the match with these teams
    const match = await prisma.match.findFirst({
      where: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
      },
    });

    if (!match) {
      console.log(`No match found for ${homeTeamName} vs ${awayTeamName}`);
      return null;
    }

    return match.id;
  } catch (error) {
    console.error(`Error finding match for ${homeTeamName} vs ${awayTeamName}:`, error);
    return null;
  }
}

// Function to convert match code to team names
async function getTeamsByCode(matchId: string, teamsMap: Map<string, string>) {
  // Extract the team codes from the match ID (e.g., "B1B2" -> "B1" and "B2")
  const homeTeamCode = matchId.substring(0, 2);
  const awayTeamCode = matchId.substring(2);

  const homeTeamName = teamsMap.get(homeTeamCode);
  const awayTeamName = teamsMap.get(awayTeamCode);

  return { homeTeamName, awayTeamName };
}

export async function seedPredictions() {
  try {
    console.log('Starting prediction seed process...');

    // Read the teams CSV file
    const teamsFilePath = resolveLocalPath('../data/teams.csv');
    const teamsContent = fs.readFileSync(teamsFilePath, { encoding: 'utf-8' });

    // Parse the teams CSV content
    const teamsRows = parse(teamsContent, {
      columns: true,
      skip_empty_lines: true,
    }) as TeamRow[];

    console.log(`Found ${teamsRows.length} teams in the CSV file.`);

    // Create a mapping of team codes to team names
    const teamCodeToName = new Map<string, string>();
    teamsRows.forEach((team) => {
      teamCodeToName.set(team.team_code, team.name);
    });

    // Read the guesses CSV file
    const guessesFilePath = resolveLocalPath('../data/subsolo2_guesses.csv');
    const guessesContent = fs.readFileSync(guessesFilePath, { encoding: 'utf-8' });

    // Parse the guesses CSV content
    const guessesRows = parse(guessesContent, {
      columns: true,
      skip_empty_lines: true,
    }) as GuessRow[];

    console.log(`Found ${guessesRows.length} predictions in the CSV file.`);

    // Process each guess
    let successCount = 0;
    let failCount = 0;

    // We'll process in batches to avoid overloading the database
    const batchSize = 15;
    const totalRows = guessesRows.length;

    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = guessesRows.slice(i, Math.min(i + batchSize, totalRows));
      const batchPromises = batch.map(async (guess) => {
        try {
          // Get the pool ID from the group_id
          const poolId = parseInt(guess.group_id, 10);
          if (isNaN(poolId)) {
            console.log(`Invalid pool ID for guess ${guess.guess_id}`);
            failCount++;
            return;
          }

          // Check if the user exists
          const user = await prisma.user.findUnique({
            where: { id: guess.user_id },
          });

          if (!user) {
            console.log(`User ${guess.user_id} not found for guess ${guess.guess_id}`);
            failCount++;
            return;
          }

          // Find the match ID in the database based on team names
          const matchId = await findMatchId(guess.home_team, guess.away_team);

          if (!matchId) {
            // Try to find using the match_id code from the CSV if direct name lookup fails
            const { homeTeamName, awayTeamName } = await getTeamsByCode(
              guess.match_id,
              teamCodeToName
            );
            if (homeTeamName && awayTeamName) {
              console.log(`trying to find match for ${homeTeamName} vs ${awayTeamName}`);
              const alternateMatchId = await findMatchId(homeTeamName, awayTeamName);
              if (!alternateMatchId) {
                console.log(
                  `Could not find match for ${homeTeamName} vs ${awayTeamName} or codes ${guess.match_id}`
                );
                failCount++;
                return;
              }

              // Create the prediction with alternate match ID
              console.log(
                `Creating prediction with alternate match ID ${alternateMatchId} for ${guess.home_team} vs ${guess.away_team}`
              );
              await createPrediction(poolId, alternateMatchId, guess);
              successCount++;
              return;
            } else {
              console.log(`Could not map match code ${guess.match_id} to team names`);
              failCount++;
              return;
            }
          }

          // Create the prediction
          console.log(
            `Creating prediction for match ${matchId} with home team ${guess.home_team} and away team ${guess.away_team}`
          );
          await createPrediction(poolId, matchId, guess);
          successCount++;
        } catch (error) {
          console.error(
            `Error processing guess ${guess.guess_id} - ${guess.home_team} vs ${guess.away_team}: --- `,
            error
          );
          failCount++;
        }
      });

      await Promise.all(batchPromises);
      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(totalRows / batchSize)}`);
    }

    console.log(`Successfully imported ${successCount} predictions`);
    console.log(`Failed to import ${failCount} predictions`);
  } catch (error) {
    console.error('Error during prediction seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createPrediction(poolId: number, matchId: number, guess: GuessRow) {
  try {
    // Check if prediction already exists
    const existingPrediction = await prisma.prediction.findUnique({
      where: {
        poolId_matchId_userId: {
          poolId: poolId,
          matchId: matchId,
          userId: guess.user_id,
        },
      },
    });

    if (existingPrediction) {
      // Update existing prediction
      console.log(
        `EXISTING PREDICTION FOUND Updating prediction for match ${matchId} with home team ${guess.home_team} and away team ${guess.away_team} for user ${guess.user_id}`
      );
      await prisma.prediction.update({
        where: {
          id: existingPrediction.id,
        },
        data: {
          predictedHomeScore: parseInt(guess.predicted_home_score, 10),
          predictedAwayScore: parseInt(guess.predicted_away_score, 10),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new prediction
      console.log(
        `Creating prediction for match ${matchId} with home team ${guess.home_team} and away team ${guess.away_team}`
      );
      await prisma.prediction.create({
        data: {
          poolId: poolId,
          matchId: matchId,
          userId: guess.user_id,
          predictedHomeScore: parseInt(guess.predicted_home_score, 10),
          predictedAwayScore: parseInt(guess.predicted_away_score, 10),
          predictedHasExtraTime: false,
          predictedHasPenalties: false,
          submittedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error creating/updating prediction:', error);
    console.log(
      `Error creating/updating prediction for match ${matchId} for user ${guess.user_id} with home team ${guess.home_team} and away team ${guess.away_team}`
    );
    throw error;
  }
}

// Intentionally do not auto-run here; the root seed.ts coordinates order
// and invokes seedPredictions() after users, teams and matches are seeded.

