import { AuthorizationError } from '@/global/errors/AuthorizationError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { MatchStage, MatchStatus, Prediction } from '@prisma/client';
import { InvalidScoreError } from './error/InvalidScoreError';
import { MatchStatusError } from './error/MatchStatusError';
import { PredictionError } from './error/PredictionError';

interface UpdatePredictionUseCaseRequest {
  predictionId: number;
  userId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedHasExtraTime?: boolean;
  predictedHasPenalties?: boolean;
  predictedPenaltyHomeScore?: number;
  predictedPenaltyAwayScore?: number;
}

export class UpdatePredictionUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private matchesRepository: IMatchesRepository
  ) {}

  async execute({
    predictionId,
    userId,
    predictedHomeScore,
    predictedAwayScore,
    predictedHasExtraTime = false,
    predictedHasPenalties = false,
    predictedPenaltyHomeScore,
    predictedPenaltyAwayScore,
  }: UpdatePredictionUseCaseRequest): Promise<Prediction> {
    // Validate scores
    if (predictedHomeScore < 0 || predictedAwayScore < 0) {
      throw new InvalidScoreError('Predicted scores cannot be negative');
    }

    // Check if prediction exists
    const existingPrediction = await this.predictionsRepository.findById(predictionId);
    if (!existingPrediction) {
      throw new ResourceNotFoundError('Prediction not found');
    }

    // Verify that the prediction belongs to the user
    if (existingPrediction.userId !== userId) {
      throw new AuthorizationError('You can only update your own predictions');
    }

    // Get the match to check its status
    const match = await this.matchesRepository.findById(existingPrediction.matchId);
    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    // Verify match status - can only update predictions for scheduled matches
    if (match.matchStatus !== MatchStatus.SCHEDULED) {
      throw new MatchStatusError('Predictions can only be updated for upcoming matches');
    }

    // Get the pool to check tournament and registration deadline
    const pool = await this.poolsRepository.getPool(existingPrediction.poolId);

    // Validate extra time and penalties for knockout stage matches
    const isKnockoutStage = match.stage !== MatchStage.GROUP; //!match.stage.toLowerCase().includes('group');
    const predictTie = predictedHomeScore === predictedAwayScore;

    if (predictedHasExtraTime && !isKnockoutStage) {
      throw new PredictionError(
        'Extra time and penalties can only be predicted for knockout stage matches'
      );
    }

    // Validate scores are tied if extra time is predicted
    if (predictedHasExtraTime && !predictTie) {
      throw new PredictionError('Extra time can only be predicted when scores are tied');
    }

    if (predictedHasPenalties && !predictTie) {
      throw new PredictionError(
        'Penalties can only be predicted when scores are tied after extra time'
      );
    }
    // Validate penalty scores if penalties are predicted
    if (
      predictedHasPenalties &&
      (predictedPenaltyHomeScore === undefined || predictedPenaltyAwayScore === undefined)
    ) {
      throw new PredictionError('Penalty scores must be provided when penalties are predicted');
    }

    // Validate penalty scores if penalties are predicted
    if (
      predictedHasPenalties &&
      (predictedPenaltyHomeScore! < 0 || predictedPenaltyAwayScore! < 0)
    ) {
      throw new PredictionError('Penalty scores must be positive numbers');
    }

    // Update the prediction
    return this.predictionsRepository.update(predictionId, {
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore: predictedHasPenalties ? predictedPenaltyHomeScore : null,
      predictedPenaltyAwayScore: predictedHasPenalties ? predictedPenaltyAwayScore : null,
      updatedAt: new Date(),
    });
  }
}
