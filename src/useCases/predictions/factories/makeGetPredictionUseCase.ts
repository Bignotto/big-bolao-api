import { PrismaPredictionsRepository } from '@/repositories/predictions/PrismaPredictionsRepository';
import { GetPredictionUseCase } from '../getPredictionUseCase';

export function makeGetPredictionUseCase() {
  const predictionsRepository = new PrismaPredictionsRepository();
  const useCase = new GetPredictionUseCase(predictionsRepository);

  return useCase;
}
