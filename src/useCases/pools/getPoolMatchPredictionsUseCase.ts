import { MatchStatus, Prediction } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolParticipant } from '@/global/types/poolParticipant';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IPredictionsRepository } from '@/repositories/predictions/IPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface GetPoolMatchPredictionsUseCaseRequest {
  poolId: number;
  matchId: number;
  userId: string;
}

interface PoolMatchPredictionParticipant {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  joinedAt: Date | null;
  isOwner: boolean;
}

export interface PoolMatchPredictionRow {
  participant: PoolMatchPredictionParticipant;
  predictionSubmitted: boolean;
  prediction: Prediction | null;
}

interface GetPoolMatchPredictionsUseCaseResponse {
  predictions: PoolMatchPredictionRow[];
}

export class GetPoolMatchPredictionsUseCase {
  constructor(
    private predictionsRepository: IPredictionsRepository,
    private poolsRepository: IPoolsRepository,
    private matchesRepository: IMatchesRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({
    poolId,
    matchId,
    userId,
  }: GetPoolMatchPredictionsUseCaseRequest): Promise<GetPoolMatchPredictionsUseCaseResponse> {
    const pool = await this.poolsRepository.findById(poolId);

    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    await this.poolAuthorizationService.validateUserPoolAccess(poolId, userId, pool.creatorId);

    const match = await this.matchesRepository.findById(matchId);

    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    if (match.tournamentId !== pool.tournamentId) {
      throw new ResourceNotFoundError('Match not found in the pool');
    }

    const [participants, matchPredictions] = await Promise.all([
      this.poolsRepository.getPoolParticipants(poolId),
      this.predictionsRepository.findByPoolIdAndMatchId(poolId, matchId),
    ]);

    const predictionByUserId = new Map(
      matchPredictions.map((prediction) => [prediction.userId, prediction])
    );
    const isScheduled = match.matchStatus === MatchStatus.SCHEDULED;

    const predictions = participants
      .sort(sortParticipants)
      .map((participant): PoolMatchPredictionRow => {
        const prediction = predictionByUserId.get(participant.id) ?? null;
        const canSeePrediction = prediction && (!isScheduled || participant.id === userId);

        return {
          participant: {
            id: participant.id,
            fullName: participant.fullName,
            profileImageUrl: participant.profileImageUrl,
            joinedAt: participant.joinedAt,
            isOwner: participant.isOwner,
          },
          predictionSubmitted: prediction !== null,
          prediction: canSeePrediction ? prediction : null,
        };
      });

    return { predictions };
  }
}

function sortParticipants(a: PoolParticipant, b: PoolParticipant): number {
  const joinedAtA = a.joinedAt?.getTime() ?? 0;
  const joinedAtB = b.joinedAt?.getTime() ?? 0;

  if (joinedAtA !== joinedAtB) {
    return joinedAtA - joinedAtB;
  }

  return a.fullName.localeCompare(b.fullName);
}
