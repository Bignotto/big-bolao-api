import { Pool, Prisma, ScoringRule } from '@prisma/client';

import { PoolParticipant } from '@/global/types/poolParticipant';
import { PoolStandings } from '@/global/types/poolStandings';

export type PoolCompleteInfo = Prisma.PoolGetPayload<{
  include: { participants: true; scoringRules: true };
}>;

export interface IPoolsRepository {
  create(data: Prisma.PoolCreateInput): Promise<Pool>;
  createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule>;
  addParticipant(data: { poolId: number; userId: string }): Promise<void>;
  removeParticipant(data: { poolId: number; userId: string }): Promise<void>;
  findById(id: number): Promise<Pool | null>;
  findByInviteCode(inviteCode: string, poolId: number): Promise<Pool | null>;
  findByCreatorId(creatorId: string): Promise<Pool[]>;
  findByParticipantId(userId: string): Promise<Pool[]>;
  getScoringRules(poolId: number): Promise<ScoringRule[]>;
  getPoolParticipants(poolId: number): Promise<PoolParticipant[]>;
  getPool(id: number): Promise<PoolCompleteInfo | null>;
  update(id: number, data: Prisma.PoolUpdateInput): Promise<Pool>;
  getPoolStandings(poolId: number): Promise<PoolStandings[]>;
  getUserPoolsStandings(userId: string): Promise<PoolStandings[]>;
  findByName(name: string): Promise<Pool | null>;
  deletePoolById(poolId: number): Promise<void>;
}
