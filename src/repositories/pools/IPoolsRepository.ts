import { Pool, Prisma, ScoringRule } from '@prisma/client';

export interface IPoolsRepository {
  create(data: Prisma.PoolCreateInput): Promise<Pool>;
  createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule>;
  addParticipant(data: { poolId: number; userId: string }): Promise<void>;
  findById(id: number): Promise<Pool | null>;
  findByInviteCode(inviteCode: string): Promise<Pool | null>;
  findByCreatorId(creatorId: string): Promise<Pool[]>;
  findByParticipantId(userId: string): Promise<Pool[]>;
}
