import { Prediction, Prisma } from '@prisma/client';
import { IPredictionsRepository } from './IPredictionsRepository';

export class InMemoryPredictionsRepository implements IPredictionsRepository {
  public predictions: Prediction[] = [];

  async create(data: Prisma.PredictionCreateInput): Promise<Prediction> {
    const newId = this.predictions.length + 1;

    const prediction: Prediction = {
      id: newId,
      poolId: data.pool.connect?.id as number,
      matchId: data.match.connect?.id as number,
      userId: data.user.connect?.id as string,
      predictedHomeScore: data.predictedHomeScore as number,
      predictedAwayScore: data.predictedAwayScore as number,
      predictedHasExtraTime: (data.predictedHasExtraTime as boolean) || false,
      predictedHasPenalties: (data.predictedHasPenalties as boolean) || false,
      predictedPenaltyHomeScore: data.predictedPenaltyHomeScore as number | null,
      predictedPenaltyAwayScore: data.predictedPenaltyAwayScore as number | null,
      submittedAt: new Date(),
      updatedAt: null,
      pointsEarned: null,
    };

    this.predictions.push(prediction);
    return prediction;
  }

  async findById(id: number): Promise<Prediction | null> {
    const prediction = this.predictions.find((prediction) => prediction.id === id);
    return prediction || null;
  }

  async findByUserMatchAndPool(
    userId: string,
    matchId: number,
    poolId: number
  ): Promise<Prediction | null> {
    const prediction = this.predictions.find(
      (prediction) =>
        prediction.userId === userId &&
        prediction.matchId === matchId &&
        prediction.poolId === poolId
    );

    return prediction || null;
  }

  async update(id: number, data: Prisma.PredictionUpdateInput): Promise<Prediction> {
    const predictionIndex = this.predictions.findIndex((prediction) => prediction.id === id);

    if (predictionIndex === -1) {
      throw new Error('Prediction not found');
    }

    const prediction = this.predictions[predictionIndex];

    const updatedPrediction: Prediction = {
      ...prediction,
      predictedHomeScore:
        typeof data.predictedHomeScore === 'number'
          ? data.predictedHomeScore
          : prediction.predictedHomeScore,
      predictedAwayScore:
        typeof data.predictedAwayScore === 'number'
          ? data.predictedAwayScore
          : prediction.predictedAwayScore,
      predictedHasExtraTime:
        typeof data.predictedHasExtraTime === 'boolean'
          ? data.predictedHasExtraTime
          : prediction.predictedHasExtraTime,
      predictedHasPenalties:
        typeof data.predictedHasPenalties === 'boolean'
          ? data.predictedHasPenalties
          : prediction.predictedHasPenalties,
      predictedPenaltyHomeScore:
        data.predictedPenaltyHomeScore !== undefined
          ? (data.predictedPenaltyHomeScore as number | null)
          : prediction.predictedPenaltyHomeScore,
      predictedPenaltyAwayScore:
        data.predictedPenaltyAwayScore !== undefined
          ? (data.predictedPenaltyAwayScore as number | null)
          : prediction.predictedPenaltyAwayScore,
      pointsEarned:
        data.pointsEarned !== undefined
          ? (data.pointsEarned as number | null)
          : prediction.pointsEarned,
      updatedAt: new Date(),
    };

    this.predictions[predictionIndex] = updatedPrediction;
    return updatedPrediction;
  }

  async delete(id: number): Promise<void> {
    const predictionIndex = this.predictions.findIndex((prediction) => prediction.id === id);

    if (predictionIndex !== -1) {
      this.predictions.splice(predictionIndex, 1);
    }
  }

  async findByMatchId(matchId: number): Promise<Prediction[]> {
    const predictions = this.predictions.filter((item) => item.matchId === matchId);
    return predictions;
  }

  async findByUserId(userId: string, poolId?: number): Promise<Prediction[]> {
    let predictions = this.predictions.filter((prediction) => prediction.userId === userId);

    if (poolId) {
      predictions = predictions.filter((prediction) => prediction.poolId === poolId);
    }

    return predictions;
  }

  async findByPoolId(poolId: number): Promise<Prediction[]> {
    return this.predictions.filter((prediction) => prediction.poolId === poolId);
  }
}
