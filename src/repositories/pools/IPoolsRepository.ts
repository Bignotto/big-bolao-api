import { Pool, Prisma, ScoringRule } from '@prisma/client';

export type PoolCompleteInfo = Prisma.PoolGetPayload<{
  include: { participants: true; scoringRules: true };
}>;

export interface IPoolsRepository {
  create(data: Prisma.PoolCreateInput): Promise<Pool>;
  createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule>;
  addParticipant(data: { poolId: number; userId: string }): Promise<void>;
  findById(id: number): Promise<Pool | null>;
  findByInviteCode(inviteCode: string): Promise<Pool | null>;
  findByCreatorId(creatorId: string): Promise<Pool[]>;
  findByParticipantId(userId: string): Promise<Pool[]>;
  getScoringRules(poolId: number): Promise<ScoringRule[]>;
  getPoolParticipants(poolId: number): Promise<{ userId: string }[]>;
  getPool(id: number): Promise<PoolCompleteInfo | null>;
  update(id: number, data: Prisma.PoolUpdateInput): Promise<Pool>;
}
