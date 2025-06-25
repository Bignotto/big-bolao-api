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
    // Validate user exists
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Get pool with related data
    const pool = await this.poolsRepository.getPool(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    // Validate scoring rules exist
    if (!pool.scoringRules) {
      throw new ResourceNotFoundError('Scoring rules not found for this pool');
    }

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

    const participants = await this.poolsRepository.getPoolParticipants(poolId);

    // Use the mapper to construct response
    return this.mapToResponse(pool, tournament, participants, isCreator, isParticipant);
  }

  private mapToResponse(
    pool: any, // Replace with proper Pool type when available
    tournament: any, // Replace with proper Tournament type when available
    participants: any[], // Replace with proper Participant[] type when available
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
        exactScorePoints: pool.scoringRules.exactScorePoints,
        correctWinnerPoints: pool.scoringRules.correctWinnerPoints,
        correctDrawPoints: pool.scoringRules.correctDrawPoints,
        correctWinnerGoalDiffPoints: pool.scoringRules.correctWinnerGoalDiffPoints,
        finalMultiplier: pool.scoringRules.finalMultiplier.toNumber(),
        knockoutMultiplier: pool.scoringRules.knockoutMultiplier.toNumber(),
      },
      tournament: tournament,
      participants: participants,
      participantsCount: participants.length,
      isCreator,
      isParticipant,
    };
  }
}
