import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { MatchStage, MatchStatus } from '@prisma/client';

interface ICreatePredictionRequest {
  userId: string;
  matchId: number;
  poolId: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedHasExtraTime?: boolean;
  predictedHasPenalties?: boolean;
  predictedPenaltyHomeScore?: number;
  predictedPenaltyAwayScore?: number;
}

export class CreatePredictionUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private matchesRepository: IMatchesRepository
  ) {}

  async execute({
    userId,
    matchId,
    poolId,
    predictedHomeScore,
    predictedAwayScore,
    predictedHasExtraTime = false,
    predictedHasPenalties = false,
    predictedPenaltyHomeScore,
    predictedPenaltyAwayScore,
  }: ICreatePredictionRequest) {
    // Check predicted negative values
    if (predictedHomeScore < 0 || predictedAwayScore < 0) {
      throw new Error('Predicted scores cannot be negative');
    }

    // Check if user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Check if pool exists
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Check if user is a participant in the pool
    const participants = await this.poolsRepository.getPoolParticipants(poolId);
    const isParticipant = participants.some((participant) => participant.userId === userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this pool');
    }

    // Check if match exists and is upcoming
    const match = await this.matchesRepository.findById(matchId);
    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    // Check if match tournament is associated with the pool
    if (match.tournamentId !== pool.tournamentId) {
      throw new Error('Match does not belong to the tournament associated with this pool');
    }

    if (match.matchStatus !== MatchStatus.SCHEDULED) {
      throw new Error('Predictions can only be made for upcoming matches');
    }

    // Check if prediction already exists
    const existingPrediction = await this.predictionsRepository.findByUserMatchAndPool(
      userId,
      matchId,
      poolId
    );

    if (existingPrediction) {
      throw new Error('Prediction already exists for this match in this pool');
    }

    if (predictedHasExtraTime && match.stage === MatchStage.GROUP) {
      throw new Error('Non knockout matches cannot have extra time or penalties');
    }

    // Validate scores are tied if extra time is predicted
    if (predictedHasPenalties && predictedHomeScore !== predictedAwayScore) {
      throw new Error('Penalties can only be predicted when scores are tied after extra time');
    }

    // Validate penalty scores if penalties are predicted
    if (
      predictedHasPenalties &&
      (predictedPenaltyHomeScore === undefined || predictedPenaltyAwayScore === undefined)
    ) {
      throw new Error('Penalty scores must be provided when penalties are predicted');
    }

    // Create prediction
    const prediction = await this.predictionsRepository.create({
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore,
      predictedPenaltyAwayScore,
      user: {
        connect: { id: userId },
      },
      match: {
        connect: { id: matchId },
      },
      pool: {
        connect: { id: poolId },
      },
    });

    return prediction;
  }
}
