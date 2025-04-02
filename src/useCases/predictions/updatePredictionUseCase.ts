import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { MatchStatus, Prediction } from '@prisma/client';

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
    // Check if prediction exists
    const existingPrediction = await this.predictionsRepository.findById(predictionId);
    if (!existingPrediction) {
      throw new ResourceNotFoundError('Prediction not found');
    }

    // Verify that the prediction belongs to the user
    if (existingPrediction.userId !== userId) {
      throw new Error('You can only update your own predictions');
    }

    // Get the match to check its status
    const match = await this.matchesRepository.findById(existingPrediction.matchId);
    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    // Verify match status - can only update predictions for scheduled matches
    if (match.matchStatus !== MatchStatus.SCHEDULED) {
      throw new Error('Predictions can only be updated for upcoming matches');
    }

    // Check if match has already started
    const now = new Date();
    if (match.matchDatetime <= now) {
      throw new Error('Cannot update predictions for matches that have already started');
    }

    // Get the pool to check tournament and registration deadline
    const pool = await this.poolsRepository.getPool(existingPrediction.poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if registration deadline has passed
    if (pool.registrationDeadline && pool.registrationDeadline < now) {
      throw new Error('Registration deadline for this pool has passed');
    }

    // Validate scores
    if (predictedHomeScore < 0 || predictedAwayScore < 0) {
      throw new Error('Predicted scores cannot be negative');
    }

    // Validate extra time and penalties for knockout stage matches
    const isKnockoutStage = !match.stage.toLowerCase().includes('group');

    if (predictedHasExtraTime && !isKnockoutStage) {
      throw new Error('Extra time and penalties can only be predicted for knockout stage matches');
    }

    // Validate penalties can only happen in a tie after extra time
    if (predictedHasPenalties) {
      if (!predictedHasExtraTime) {
        throw new Error('Penalties can only occur after extra time');
      }

      if (predictedHomeScore !== predictedAwayScore) {
        throw new Error('Penalties can only be predicted when scores are tied after extra time');
      }

      if (predictedPenaltyHomeScore === undefined || predictedPenaltyAwayScore === undefined) {
        throw new Error('Penalty scores must be provided when penalties are predicted');
      }

      if (predictedPenaltyHomeScore < 0 || predictedPenaltyAwayScore < 0) {
        throw new Error('Penalty scores cannot be negative');
      }

      if (predictedPenaltyHomeScore === predictedPenaltyAwayScore) {
        throw new Error('Penalty shootout cannot end in a tie');
      }
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
