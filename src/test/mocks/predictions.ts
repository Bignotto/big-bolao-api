import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { Prediction } from '@prisma/client';

export async function createPrediction(
  repository: IPredictionsRepository,
  data: {
    matchId?: number;
    poolId?: number;
    userId?: string;
    predictedHomeScore?: number;
    predictedAwayScore?: number;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    penaltyHomeScore?: number;
    penaltyAwayScore?: number;
  }
): Promise<Prediction> {
  const randomPredictionNumber = Math.floor(Math.random() * 100);
  const homeRandomNumber = Math.floor(Math.random() * 10);
  const awayRandomNumber = Math.floor(Math.random() * 10);

  const prediction = await repository.create({
    match: {
      connect: {
        id: data.matchId ?? randomPredictionNumber,
      },
    },
    pool: {
      connect: {
        id: data.poolId ?? randomPredictionNumber,
      },
    },
    user: {
      connect: {
        id: data.userId ?? `user-${randomPredictionNumber}`,
      },
    },
    predictedHomeScore: data.predictedHomeScore ?? randomPredictionNumber,
    predictedAwayScore: data.predictedAwayScore ?? randomPredictionNumber,
    predictedHasExtraTime: data.hasExtraTime ?? false,
    predictedHasPenalties: data.hasPenalties ?? false,
    predictedPenaltyHomeScore: data.penaltyHomeScore ?? 0,
    predictedPenaltyAwayScore: data.penaltyAwayScore ?? 0,
  });

  return prediction;
}
