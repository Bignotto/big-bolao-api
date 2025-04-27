import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedScoringRules(poolId: number) {
  try {
    const scoringRule = await prisma.scoringRule.upsert({
      where: { poolId },
      update: {}, // No updates if already exists
      create: {
        poolId,
        exactScorePoints: 5,
        correctWinnerGoalDiffPoints: 3,
        correctWinnerPoints: 2,
        correctDrawPoints: 2,
        specialEventPoints: 3,
        knockoutMultiplier: 1.5,
        finalMultiplier: 2.0,
      },
    });

    console.log(`Created scoring rules for pool ${poolId}:
      - Exact Score: ${scoringRule.exactScorePoints} points
      - Correct Winner + Goal Diff: ${scoringRule.correctWinnerGoalDiffPoints} points
      - Correct Winner: ${scoringRule.correctWinnerPoints} points
      - Correct Draw: ${scoringRule.correctDrawPoints} points
      - Special Events: ${scoringRule.specialEventPoints} points
      - Knockout Multiplier: ${scoringRule.knockoutMultiplier}x
      - Final Multiplier: ${scoringRule.finalMultiplier}x`);

    return scoringRule;
  } catch (error) {
    console.error(`Error creating scoring rules for pool ${poolId}:`, error);
    throw error;
  }
}
