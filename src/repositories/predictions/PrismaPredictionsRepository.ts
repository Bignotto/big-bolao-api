import { Prediction, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { IPredictionsRepository } from './IPredictionsRepository';

export class PrismaPredictionsRepository implements IPredictionsRepository {
  async create(data: Prisma.PredictionCreateInput): Promise<Prediction> {
    const prediction = await prisma.prediction.create({
      data,
    });

    return prediction;
  }

  async findById(id: number): Promise<Prediction | null> {
    const prediction = await prisma.prediction.findUnique({
      where: { id },
    });

    return prediction;
  }

  async findByUserMatchAndPool(
    userId: string,
    matchId: number,
    poolId: number
  ): Promise<Prediction | null> {
    const prediction = await prisma.prediction.findUnique({
      where: {
        poolId_matchId_userId: {
          poolId,
          matchId,
          userId,
        },
      },
    });

    return prediction;
  }

  async update(id: number, data: Prisma.PredictionUpdateInput): Promise<Prediction> {
    const prediction = await prisma.prediction.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return prediction;
  }

  async delete(id: number): Promise<void> {
    await prisma.prediction.delete({
      where: { id },
    });
  }

  async findByMatchId(matchId: number): Promise<Prediction[]> {
    const predictions = await prisma.prediction.findMany({
      where: {
        matchId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        pool: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return predictions;
  }
}
