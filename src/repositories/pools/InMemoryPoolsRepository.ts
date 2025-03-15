import { Pool, Prisma, ScoringRule } from '@prisma/client';
import { IPoolsRepository } from './IPoolsRepository';

export class InMemoryPoolsRepository implements IPoolsRepository {
  private pools: Pool[] = [];
  private scoringRules: ScoringRule[] = [];
  private participants: { poolId: number; userId: string }[] = [];

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
    this.participants.push(data);
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
