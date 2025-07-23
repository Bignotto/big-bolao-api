import { Pool, PoolParticipant, ScoringRule, Tournament } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

interface IGetPoolRequest {
  poolId: number;
  userId: string; // User requesting the pool info (for authorization checks if needed)
}

interface IGetPoolResponse {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  maxParticipants?: number;
  registrationDeadline?: Date;
  createdAt: Date;
  creatorId: string;
  tournamentId: number;
  scoringRules: {
    exactScorePoints: number;
    correctWinnerPoints: number;
    correctDrawPoints: number;
    correctWinnerGoalDiffPoints: number;
    finalMultiplier: number;
    knockoutMultiplier: number;
  };
  tournament?: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
  participants: {
    userId: string;
  }[];
  participantsCount: number;
  isCreator: boolean;
  isParticipant: boolean;
}

export class GetPoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private tournamentRepository: ITournamentsRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({ poolId, userId }: IGetPoolRequest): Promise<IGetPoolResponse> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const pool = await this.poolsRepository.getPool(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    if (!pool.scoringRules) {
      throw new ResourceNotFoundError('Scoring rules not found for this pool');
    }

    const scoringRules = pool.scoringRules;

    // Use the authorization service
    const { isCreator, isParticipant } = await this.poolAuthorizationService.validateUserPoolAccess(
      poolId,
      userId,
      pool.creatorId
    );

    const tournament = await this.tournamentRepository.findById(pool.tournamentId);
    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    const participants = pool.participants;

    return this.mapToResponse(
      pool,
      scoringRules,
      tournament,
      participants,
      isCreator,
      isParticipant
    );
  }

  private mapToResponse(
    pool: Pool,
    scoringRules: ScoringRule,
    tournament: Tournament,
    participants: PoolParticipant[],
    isCreator: boolean,
    isParticipant: boolean
  ): IGetPoolResponse {
    return {
      id: pool.id,
      name: pool.name,
      description: pool.description ?? undefined,
      isPrivate: pool.isPrivate,
      maxParticipants: pool.maxParticipants ?? undefined,
      registrationDeadline: pool.registrationDeadline ?? undefined,
      createdAt: pool.createdAt,
      creatorId: pool.creatorId,
      tournamentId: pool.tournamentId,
      scoringRules: {
        exactScorePoints: scoringRules.exactScorePoints,
        correctWinnerPoints: scoringRules.correctWinnerPoints,
        correctDrawPoints: scoringRules.correctDrawPoints,
        correctWinnerGoalDiffPoints: scoringRules.correctWinnerGoalDiffPoints,
        finalMultiplier: scoringRules.finalMultiplier.toNumber(),
        knockoutMultiplier: scoringRules.knockoutMultiplier.toNumber(),
      },
      tournament: tournament,
      participants: participants,
      participantsCount: participants.length,
      isCreator,
      isParticipant,
    } as IGetPoolResponse;
  }
}
