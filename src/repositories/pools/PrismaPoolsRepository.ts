import { Pool, Prisma, ScoringRule } from '@prisma/client';

import { InviteCodeInUseError } from '@/global/errors/InviteCodeInUseError';
import { PoolParticipant } from '@/global/types/poolParticipant';
import { PoolStandings } from '@/global/types/poolStandings';

import { IPoolsRepository, PoolCompleteInfo } from './IPoolsRepository';
import { prisma } from '../../lib/prisma';

export class PrismaPoolsRepository implements IPoolsRepository {
  async getScoringRules(poolId: number): Promise<ScoringRule[]> {
    const scoringRules = await prisma.scoringRule.findMany({
      where: { poolId },
    });

    return scoringRules;
  }

  async getPoolParticipants(poolId: number): Promise<PoolParticipant[]> {
    const users = await prisma.user.findMany({
      where: {
        pools: {
          some: {
            poolId: poolId,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImageUrl: true,
        createdAt: true,
        lastLogin: true,
        accountProvider: true,
        role: true,
        // Inclui o relacionamento para pegar o joinedAt
        pools: {
          where: {
            poolId: poolId,
          },
          select: {
            joinedAt: true,
          },
        },
      },
    });

    // Transforma para incluir joinedAt no nível do usuário
    return users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      accountProvider: user.accountProvider,
      role: user.role,
      joinedAt: user.pools[0].joinedAt, // Sempre terá pelo menos 1 item devido ao filtro
      isOwner: user.pools[0].joinedAt !== null, // Se joinedAt for null, não é dono
    }));
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
    try {
      const pool = await prisma.pool.create({
        data,
      });

      return pool;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        (error.meta?.target as string[]).includes('inviteCode')
      ) {
        throw new InviteCodeInUseError(data.inviteCode as string);
      }

      throw error;
    }
  }

  async createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule> {
    const scoringRules = await prisma.scoringRule.create({
      data,
    });

    return scoringRules;
  }

  async addParticipant({ poolId, userId }: { poolId: number; userId: string }): Promise<void> {
    await prisma.poolParticipant.create({
      data: {
        poolId,
        userId,
      },
    });
  }

  async findById(id: number): Promise<Pool | null> {
    const pool = await prisma.pool.findUnique({
      where: { id },
      include: { tournament: true },
    });

    return pool;
  }

  async findByInviteCode(inviteCode: string): Promise<Pool | null> {
    const pool = await prisma.pool.findFirst({
      where: { inviteCode },
      include: { tournament: true },
    });

    return pool;
  }

  async findByCreatorId(creatorId: string): Promise<Pool[]> {
    const pools = await prisma.pool.findMany({
      where: { creatorId },
    });

    return pools;
  }

  async findByParticipantId(userId: string): Promise<Pool[]> {
    const poolParticipants = await prisma.poolParticipant.findMany({
      where: { userId },
      include: { pool: true },
    });

    return poolParticipants.map((participant) => participant.pool);
  }

  async findPublicPools({
    page,
    perPage,
    name,
  }: {
    page: number;
    perPage: number;
    name?: string;
  }): Promise<Pool[]> {
    const pools = await prisma.pool.findMany({
      where: {
        isPrivate: false,
        ...(name
          ? {
              name: {
                contains: name,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return pools;
  }

  async removeParticipant({ poolId, userId }: { poolId: number; userId: string }): Promise<void> {
    await prisma.poolParticipant.delete({
      where: {
        poolId_userId: {
          poolId,
          userId,
        },
      },
    });
  }

  async getPoolStandings(poolId: number): Promise<PoolStandings[]> {
    const poolStandings = await prisma.$queryRaw<PoolStandings[]>`
    SELECT * FROM pool_standings
    WHERE "poolId" = ${poolId}
    ORDER BY "ranking"
    `;
    return poolStandings.map((standing) => ({
      ...standing,
      ranking: Number(standing.ranking),
      totalPoints: Number(standing.totalPoints),
      totalPredictions: Number(standing.totalPredictions),
      exactScoreCount: Number(standing.exactScoreCount),
      pointsRatio: Number(standing.pointsRatio),
      guessRatio: Number(standing.guessRatio),
      predictionsRatio: Number(standing.predictionsRatio),
    }));
  }

  async getUserPoolsStandings(userId: string): Promise<PoolStandings[]> {
    const userStandings = await prisma.$queryRaw<PoolStandings[]>`
    SELECT * FROM pool_standings
    WHERE "userId" = ${userId}
    ORDER BY "ranking"
    `;
    return userStandings.map((standing) => ({
      ...standing,
      ranking: Number(standing.ranking),
      totalPoints: Number(standing.totalPoints),
      totalPredictions: Number(standing.totalPredictions),
      exactScoreCount: Number(standing.exactScoreCount),
      pointsRatio: Number(standing.pointsRatio),
      guessRatio: Number(standing.guessRatio),
      predictionsRatio: Number(standing.predictionsRatio),
    }));
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

  async deletePoolById(poolId: number): Promise<void> {
    await prisma.poolParticipant.deleteMany({
      where: { poolId },
    });
    await prisma.scoringRule.deleteMany({
      where: { poolId },
    });
    await prisma.pool.delete({
      where: { id: poolId },
    });
  }
}
