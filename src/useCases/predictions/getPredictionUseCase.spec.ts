import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { createPrediction } from '@/test/mocks/predictions';
import { Prediction } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPredictionUseCase } from './getPredictionUseCase';

describe('Get Prediction Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let sut: GetPredictionUseCase;
  let prediction: Prediction;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    sut = new GetPredictionUseCase(predictionsRepository);

    // Create a mock prediction
    prediction = await createPrediction(predictionsRepository, {
      userId: 'user-01',
      matchId: 1,
      poolId: 1,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
  });

  it('should be able to get a prediction by id', async () => {
    const result = await sut.execute({
      predictionId: 1,
      userId: 'user-01',
    });

    expect(result).toEqual(prediction);
  });

  it('should not be able to get a non-existent prediction', async () => {
    await expect(() =>
      sut.execute({
        predictionId: 999,
        userId: 'user-01',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to get a prediction from another user', async () => {
    await expect(() =>
      sut.execute({
        predictionId: 1,
        userId: 'user-02',
      })
    ).rejects.toThrowError('You can only access your own predictions');
  });
});
