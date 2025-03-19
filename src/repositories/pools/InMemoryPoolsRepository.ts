import { Pool, Prisma, ScoringRule } from '@prisma/client';

import { IPoolsRepository, PoolCompleteInfo } from './IPoolsRepository';

export class InMemoryPoolsRepository implements IPoolsRepository {
  private pools: Pool[] = [];
  private scoringRules: ScoringRule[] = [];
  private participants: { poolId: number; userId: string; joinedAt: Date }[] = [];

  async create(data: Prisma.PoolCreateInput): Promise<Pool> {
    const newId = this.pools.length + 1;

    const pool: Pool = {
      id: newId,
      name: data.name,
      tournamentId: data.tournament.connect?.id as number,
      inviteCode: data.inviteCode ?? 'CONVITE',
      createdAt: new Date(),
      creatorId: data.creator.connect?.id || '',
      description: data.description ?? '',
      isPrivate: data.isPrivate as boolean,
      maxParticipants: data.maxParticipants as number,
      registrationDeadline: data.registrationDeadline as Date,
    };

    this.pools.push(pool);
    return pool;
  }

  async getScoringRules(poolId: number): Promise<ScoringRule[]> {
    return this.scoringRules.filter((rule) => rule.poolId === poolId);
  }

  async getPoolParticipants(poolId: number): Promise<{ poolId: number; userId: string }[]> {
    return this.participants.filter((participant) => participant.poolId === poolId);
  }

  async getPool(poolId: number): Promise<PoolCompleteInfo | null> {
    const participants = this.participants.filter((participant) => participant.poolId === poolId);
    const pool = this.pools.find((pool) => pool.id === poolId);
    const scoringRules = this.scoringRules.filter((rule) => rule.poolId === poolId);

    if (!pool) {
      return null;
    }

    return {
      ...pool,
      participants,
      scoringRules: scoringRules[0],
    };
  }

  async update(id: number, data: Prisma.PoolUpdateInput): Promise<Pool> {
    const poolIndex = this.pools.findIndex((pool) => pool.id === id);
    if (poolIndex === -1) {
      throw new Error('Pool not found');
    }

    const updatedPool: Pool = {
      ...this.pools[poolIndex],
      name: typeof data.name === 'string' ? data.name : this.pools[poolIndex].name,
      description:
        typeof data.description === 'string' ? data.description : this.pools[poolIndex].description,
      isPrivate:
        typeof data.isPrivate === 'boolean' ? data.isPrivate : this.pools[poolIndex].isPrivate,
      inviteCode:
        typeof data.inviteCode === 'string' ? data.inviteCode : this.pools[poolIndex].inviteCode,
      maxParticipants:
        typeof data.maxParticipants === 'number'
          ? data.maxParticipants
          : this.pools[poolIndex].maxParticipants,
      registrationDeadline:
        data.registrationDeadline instanceof Date
          ? data.registrationDeadline
          : this.pools[poolIndex].registrationDeadline,
      tournamentId: data.tournament?.connect?.id ?? this.pools[poolIndex].tournamentId,
      creatorId: data.creator?.connect?.id ?? this.pools[poolIndex].creatorId,
      createdAt: this.pools[poolIndex].createdAt,
      id: this.pools[poolIndex].id,
    };

    this.pools[poolIndex] = updatedPool as Pool;
    return updatedPool as Pool;
  }

  async createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule> {
    const newId = this.scoringRules.length + 1;

    const scoringRule: ScoringRule = {
      id: newId,
      poolId: data.pool.connect?.id as number,
      correctDrawPoints: data.correctDrawPoints as number,
      correctWinnerGoalDiffPoints: data.correctWinnerGoalDiffPoints as number,
      correctWinnerPoints: data.correctWinnerPoints as number,
      exactScorePoints: data.exactScorePoints as number,
      finalMultiplier: new Prisma.Decimal(data.finalMultiplier as number),
      knockoutMultiplier: new Prisma.Decimal(data.knockoutMultiplier as number),
      specialEventPoints: data.specialEventPoints as number,
    };

    this.scoringRules.push(scoringRule);
    return scoringRule;
  }

  async addParticipant(data: { poolId: number; userId: string }): Promise<void> {
    this.participants.push({ ...data, joinedAt: new Date() });
  }

  async findById(id: number): Promise<Pool | null> {
    const pool = this.pools.find((pool) => pool.id === id);
    return pool || null;
  }

  async findByInviteCode(inviteCode: string): Promise<Pool | null> {
    const pool = this.pools.find((pool) => pool.inviteCode === inviteCode);
    return pool || null;
  }

  async findByCreatorId(creatorId: string): Promise<Pool[]> {
    return this.pools.filter((pool) => pool.creatorId === creatorId);
  }

  async findByParticipantId(userId: string): Promise<Pool[]> {
    const participantPoolIds = this.participants
      .filter((participant) => participant.userId === userId)
      .map((participant) => participant.poolId);

    return this.pools.filter(
      (pool) => participantPoolIds.includes(pool.id) || pool.creatorId === userId
    );
  }
}
