import { ScoringRule, Tournament } from '@prisma/client';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IPoolsRepository, PoolCompleteInfo } from '@/repositories/pools/IPoolsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';

interface IGetPoolByInviteRequest {
  inviteCode: string;
}

interface IGetPoolByInviteResponse {
  id: number;
  name: string;
  description?: string;
  isPrivate: boolean;
  maxParticipants?: number;
  registrationDeadline?: Date;
  createdAt: Date;
  creatorId: string;
  tournamentId: number;
  inviteCode?: string | null; // include to maintain compatibility
  scoringRules: {
    exactScorePoints: number;
    correctWinnerPoints: number;
    correctDrawPoints: number;
    correctWinnerGoalDiffPoints: number;
    finalMultiplier: number;
    knockoutMultiplier: number;
  };
  tournament?: Tournament;
  participantsCount: number;
}

export class GetPoolByInviteUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private tournamentsRepository: ITournamentsRepository
  ) {}

  async execute({ inviteCode }: IGetPoolByInviteRequest): Promise<IGetPoolByInviteResponse> {
    const poolByCode = await this.poolsRepository.findByInviteCode(inviteCode);
    if (!poolByCode) {
      throw new ResourceNotFoundError('Pool not found with this invite code');
    }

    const pool = await this.poolsRepository.getPool(poolByCode.id);
    if (!pool || !pool.scoringRules) {
      throw new ResourceNotFoundError('Pool not found');
    }

    const tournament = await this.tournamentsRepository.findById(pool.tournamentId);
    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    return this.mapToResponse(pool, pool.scoringRules, tournament);
  }

  private mapToResponse(
    pool: PoolCompleteInfo,
    scoringRules: ScoringRule,
    tournament: Tournament
  ): IGetPoolByInviteResponse {
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
      inviteCode: pool.inviteCode,
      scoringRules: {
        exactScorePoints: scoringRules.exactScorePoints,
        correctWinnerPoints: scoringRules.correctWinnerPoints,
        correctDrawPoints: scoringRules.correctDrawPoints,
        correctWinnerGoalDiffPoints: scoringRules.correctWinnerGoalDiffPoints,
        finalMultiplier: scoringRules.finalMultiplier.toNumber(),
        knockoutMultiplier: scoringRules.knockoutMultiplier.toNumber(),
      },
      tournament: tournament,
      participantsCount: pool.participants.length,
    };
  }
}

