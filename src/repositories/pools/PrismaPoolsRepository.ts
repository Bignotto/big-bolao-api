import { Pool, Prisma, ScoringRule } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { IPoolsRepository } from './IPoolsRepository';

export class PrismaPoolsRepository implements IPoolsRepository {
  async create(data: Prisma.PoolCreateInput): Promise<Pool> {
    const pool = await prisma.pool.create({
      data,
    });

    return pool;
  }

  async createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule> {
    const scoringRules = await prisma.scoringRule.create({
      data,
    });

    return scoringRules;
  }

  async addParticipant({ poolId, userId }: { poolId: number; userId: string }) {
    await prisma.poolParticipant.create({
      data: {
        poolId,
        userId,
      },
    });
  }

  async findById(id: number) {
    const pool = await prisma.pool.findUnique({
      where: { id },
    });

    return pool;
  }

  async findByInviteCode(inviteCode: string) {
    const pool = await prisma.pool.findUnique({
      where: { inviteCode },
    });

    return pool;
  }

  async findByCreatorId(creatorId: string) {
    const pools = await prisma.pool.findMany({
      where: { creatorId },
    });

    return pools;
  }

  async findByParticipantId(userId: string) {
    const poolParticipants = await prisma.poolParticipant.findMany({
      where: { userId },
      include: { pool: true },
    });

    return poolParticipants.map((participant) => participant.pool);
  }
}
