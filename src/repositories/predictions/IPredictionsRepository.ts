import { Prediction, Prisma } from '@prisma/client';

export interface IPredictionsRepository {
  create(data: Prisma.PredictionCreateInput): Promise<Prediction>;
  findById(id: number): Promise<Prediction | null>;
  findByUserMatchAndPool(
    userId: string,
    matchId: number,
    poolId: number
  ): Promise<Prediction | null>;
  update(id: number, data: Prisma.PredictionUpdateInput): Promise<Prediction>;
  delete(id: number): Promise<void>;
  findByMatchId(matchId: number): Promise<Prediction[]>;
  findByUserId(userId: string, poolId?: number): Promise<Prediction[]>;
  findByPoolId(poolId: number): Promise<Prediction[]>; // New method
}
