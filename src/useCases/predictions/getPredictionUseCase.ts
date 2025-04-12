import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { Prediction } from '@prisma/client';

interface GetPredictionUseCaseRequest {
  predictionId: number;
  userId: string;
}

export class GetPredictionUseCase {
  constructor(private predictionsRepository: IPredictionsRepository) {}

  async execute({ predictionId, userId }: GetPredictionUseCaseRequest): Promise<Prediction> {
    // Check if prediction exists
    const prediction = await this.predictionsRepository.findById(predictionId);

    if (!prediction) {
      throw new ResourceNotFoundError('Prediction not found');
    }

    // Verify that the prediction belongs to the user
    if (prediction.userId !== userId) {
      throw new Error('You can only access your own predictions');
    }

    return prediction;
  }
}
