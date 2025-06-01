import { PoolStandings } from '@/global/types/poolStandings';
import { Pool, Prisma, ScoringRule } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { IPoolsRepository, PoolCompleteInfo } from './IPoolsRepository';

export class PrismaPoolsRepository implements IPoolsRepository {
  async getScoringRules(poolId: number): Promise<ScoringRule[]> {
    const scoringRules = await prisma.scoringRule.findMany({
      where: { poolId },
    });

    return scoringRules;
  }

  async getPoolParticipants(poolId: number): Promise<{ userId: string }[]> {
    const participants = await prisma.poolParticipant.findMany({
      where: { poolId },
      select: { userId: true },
    });

    return participants;
  }

  async getPool(id: number): Promise<PoolCompleteInfo | null> {
    const pool = await prisma.pool.findUnique({
      where: { id },
      include: { participants: true, scoringRules: true },
    });

    return pool;
  }

  async update(id: number, data: Prisma.PoolUpdateInput): Promise<Pool> {
    const pool = await prisma.pool.update({
      where: { id },
      data,
    });

    return pool;
  }
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

  async removeParticipant({ poolId, userId }: { poolId: number; userId: string }) {
    await prisma.poolParticipant.delete({
      where: {
        poolId_userId: {
          poolId,
          userId,
        },
      },
    });
  }

  async getPoolStandings(poolId: number) {
    const poolStandings = await prisma.$queryRaw<PoolStandings[]>`
    SELECT * FROM pool_standings
    WHERE "poolId" = ${poolId}
    ORDER BY "ranking"
    `;
    return poolStandings;
  }

  async getUserPoolsStandings(userId: string) {
    const userStandings = await prisma.$queryRaw<PoolStandings[]>`
    SELECT * FROM pool_standings
    WHERE "userId" = ${userId}
    ORDER BY "ranking"
    `;
    return userStandings;
  }

  async findByName(name: string): Promise<Pool | null> {
    const pool = await prisma.pool.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive', // optional: makes it case-insensitive
        },
      },
    });

    return pool;
  }
}
