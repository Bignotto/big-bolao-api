import type { ScoringRule } from '@prisma/client';

import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface IUpdateScoringRulesRequest {
  poolId: number;
  userId: string;
  exactScorePoints?: number;
  correctWinnerGoalDiffPoints?: number;
  correctWinnerPoints?: number;
  correctDrawPoints?: number;
  specialEventPoints?: number;
  knockoutMultiplier?: number;
  finalMultiplier?: number;
}

export class UpdateScoringRulesUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private poolAuthorizationService: PoolAuthorizationService
  ) {}

  async execute({
    poolId,
    userId,
    exactScorePoints,
    correctWinnerGoalDiffPoints,
    correctWinnerPoints,
    correctDrawPoints,
    specialEventPoints,
    knockoutMultiplier,
    finalMultiplier,
  }: IUpdateScoringRulesRequest): Promise<ScoringRule> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new ResourceNotFoundError('Pool not found');
    }

    this.poolAuthorizationService.validatePoolCreatorAccess(poolId, userId, pool.creatorId);

    const [existingRules] = await this.poolsRepository.getScoringRules(poolId);
    if (!existingRules) {
      throw new ResourceNotFoundError('Scoring rules not found for this pool');
    }

    const updates = Object.fromEntries(
      Object.entries({
        exactScorePoints,
        correctWinnerGoalDiffPoints,
        correctWinnerPoints,
        correctDrawPoints,
        specialEventPoints,
        knockoutMultiplier,
        finalMultiplier,
      }).filter(([, v]) => v !== undefined)
    );

    return this.poolsRepository.updateScoringRules(poolId, updates);
  }
}
