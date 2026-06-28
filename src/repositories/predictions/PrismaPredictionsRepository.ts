import { Prediction, Prisma } from '@prisma/client';

import { MatchOddsRaw } from '@/global/types/matchOdds';

import { IPredictionsRepository, UserPredictionWithPoints } from './IPredictionsRepository';
import { prisma } from '../../lib/prisma';

export class PrismaPredictionsRepository implements IPredictionsRepository {
  async create(data: Prisma.PredictionCreateInput): Promise<Prediction> {
    const prediction = await prisma.prediction.create({
      data,
    });

    return prediction;
  }

  async findById(id: number): Promise<Prediction | null> {
    const prediction = await prisma.prediction.findUnique({
      where: { id },
    });

    return prediction;
  }

  async findByUserMatchAndPool(
    userId: string,
    matchId: number,
    poolId: number
  ): Promise<Prediction | null> {
    const prediction = await prisma.prediction.findUnique({
      where: {
        poolId_matchId_userId: {
          poolId,
          matchId,
          userId,
        },
      },
    });

    return prediction;
  }

  async update(id: number, data: Prisma.PredictionUpdateInput): Promise<Prediction> {
    const prediction = await prisma.prediction.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return prediction;
  }

  async delete(id: number): Promise<void> {
    await prisma.prediction.delete({
      where: { id },
    });
  }

  async findByMatchId(matchId: number): Promise<Prediction[]> {
    const predictions = await prisma.prediction.findMany({
      where: {
        matchId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        pool: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return predictions;
  }

  async findByUserId(userId: string, poolId?: number): Promise<Prediction[]> {
    const whereClause: Prisma.PredictionWhereInput = {
      userId,
    };

    if (poolId) {
      whereClause.poolId = poolId;
    }

    const predictions = await prisma.prediction.findMany({
      where: whereClause,
      orderBy: {
        submittedAt: 'desc',
      },
    });

    return predictions;
  }

  async findByPoolId(poolId: number): Promise<Prediction[]> {
    const predictions = await prisma.prediction.findMany({
      where: {
        poolId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        match: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
      orderBy: {
        match: {
          matchDatetime: 'asc',
        },
      },
    });

    return predictions;
  }

  async findByPoolIdAndMatchId(poolId: number, matchId: number): Promise<Prediction[]> {
    const predictions = await prisma.prediction.findMany({
      where: {
        poolId,
        matchId,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    return predictions;
  }

  async getMatchOdds(poolId: number, tournamentId: number): Promise<MatchOddsRaw[]> {
    const results = await prisma.$queryRaw<MatchOddsRaw[]>`
      SELECT
        M.id                    AS "matchId",
        H.id                    AS "homeTeamId",
        H.name                  AS "homeTeamName",
        H."countryCode"         AS "homeTeamCountryCode",
        H."flagUrl"             AS "homeTeamFlagUrl",
        A.id                    AS "awayTeamId",
        A.name                  AS "awayTeamName",
        A."countryCode"         AS "awayTeamCountryCode",
        A."flagUrl"             AS "awayTeamFlagUrl",
        COUNT(*) FILTER (WHERE PR."predictedHomeScore" > PR."predictedAwayScore")
                                AS "globalHomeWins",
        COUNT(*) FILTER (WHERE PR."predictedHomeScore" = PR."predictedAwayScore")
                                AS "globalDraws",
        COUNT(*) FILTER (WHERE PR."predictedAwayScore" > PR."predictedHomeScore")
                                AS "globalAwayWins",
        COUNT(PR.id)            AS "globalTotal",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedHomeScore" > PR."predictedAwayScore")
                                AS "poolHomeWins",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedHomeScore" = PR."predictedAwayScore")
                                AS "poolDraws",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedAwayScore" > PR."predictedHomeScore")
                                AS "poolAwayWins",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId})
                                AS "poolTotal"
      FROM matches AS M
        INNER JOIN teams AS H ON H.id = M."homeTeamId"
        INNER JOIN teams AS A ON A.id = M."awayTeamId"
        LEFT JOIN predictions AS PR ON PR."matchId" = M.id
      WHERE M."tournamentId" = ${tournamentId}
      GROUP BY M.id, H.id, H.name, H."countryCode", H."flagUrl",
               A.id, A.name, A."countryCode", A."flagUrl"
      ORDER BY M.id
    `;

    return results;
  }

  async getMatchOddsByMatchId(
    poolId: number,
    tournamentId: number,
    matchId: number
  ): Promise<MatchOddsRaw | null> {
    const results = await prisma.$queryRaw<MatchOddsRaw[]>`
      SELECT
        M.id                    AS "matchId",
        H.id                    AS "homeTeamId",
        H.name                  AS "homeTeamName",
        H."countryCode"         AS "homeTeamCountryCode",
        H."flagUrl"             AS "homeTeamFlagUrl",
        A.id                    AS "awayTeamId",
        A.name                  AS "awayTeamName",
        A."countryCode"         AS "awayTeamCountryCode",
        A."flagUrl"             AS "awayTeamFlagUrl",
        COUNT(*) FILTER (WHERE PR."predictedHomeScore" > PR."predictedAwayScore")
                                AS "globalHomeWins",
        COUNT(*) FILTER (WHERE PR."predictedHomeScore" = PR."predictedAwayScore")
                                AS "globalDraws",
        COUNT(*) FILTER (WHERE PR."predictedAwayScore" > PR."predictedHomeScore")
                                AS "globalAwayWins",
        COUNT(PR.id)            AS "globalTotal",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedHomeScore" > PR."predictedAwayScore")
                                AS "poolHomeWins",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedHomeScore" = PR."predictedAwayScore")
                                AS "poolDraws",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId} AND PR."predictedAwayScore" > PR."predictedHomeScore")
                                AS "poolAwayWins",
        COUNT(*) FILTER (WHERE PR."poolId" = ${poolId})
                                AS "poolTotal"
      FROM matches AS M
        INNER JOIN teams AS H ON H.id = M."homeTeamId"
        INNER JOIN teams AS A ON A.id = M."awayTeamId"
        LEFT JOIN predictions AS PR ON PR."matchId" = M.id
      WHERE M."tournamentId" = ${tournamentId}
        AND M.id = ${matchId}
      GROUP BY M.id, H.id, H.name, H."countryCode", H."flagUrl",
               A.id, A.name, A."countryCode", A."flagUrl"
    `;

    return results[0] ?? null;
  }

  async findCompletedWithPointsByUserAndPool(
    userId: string,
    poolId: number
  ): Promise<UserPredictionWithPoints[]> {
    type RawRow = {
      predictionId: number;
      matchId: number;
      predictedHomeScore: number;
      predictedAwayScore: number;
      predictedHasExtraTime: boolean;
      predictedHasPenalties: boolean;
      pointsEarned: number;
      exactScore: boolean;
      correctWinner: boolean;
      matchDate: Date;
      status: string;
      homeScore: number;
      awayScore: number;
      homeTeamName: string;
      homeTeamFlag: string | null;
      awayTeamName: string;
      awayTeamFlag: string | null;
    };

    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        pp."Prediction"                                         AS "predictionId",
        pp."matchId",
        pp."predictedHome"                                      AS "predictedHomeScore",
        pp."predictedAway"                                      AS "predictedAwayScore",
        pp."predictedHasExtraTime",
        pp."predictedHasPenalties",
        CAST(pp."TotalPoints" AS FLOAT)                        AS "pointsEarned",
        CASE WHEN pp."exactScore" = 1 THEN true ELSE false END AS "exactScore",
        CASE
          WHEN sign((pp."predictedHome" - pp."predictedAway")::float)
             = sign((pp."homeTeamScore" - pp."awayTeamScore")::float)
          THEN true ELSE false
        END                                                     AS "correctWinner",
        m."matchDatetime"                                       AS "matchDate",
        m."matchStatus"                                         AS "status",
        pp."homeTeamScore"                                      AS "homeScore",
        pp."awayTeamScore"                                      AS "awayScore",
        ht.name                                                 AS "homeTeamName",
        ht."flagUrl"                                            AS "homeTeamFlag",
        at.name                                                 AS "awayTeamName",
        at."flagUrl"                                            AS "awayTeamFlag"
      FROM prediction_points pp
      JOIN matches m ON m.id = pp."matchId"
      JOIN teams ht  ON ht.id = m."homeTeamId"
      JOIN teams at  ON at.id = m."awayTeamId"
      WHERE pp."userId" = ${userId}
        AND pp."poolId" = ${poolId}
      ORDER BY m."matchDatetime" DESC
    `;

    return rows.map((row) => ({
      predictionId: row.predictionId,
      matchId: row.matchId,
      predictedHomeScore: row.predictedHomeScore,
      predictedAwayScore: row.predictedAwayScore,
      predictedHasExtraTime: row.predictedHasExtraTime,
      predictedHasPenalties: row.predictedHasPenalties,
      pointsEarned: row.pointsEarned ?? 0,
      exactScore: row.exactScore,
      correctWinner: row.correctWinner,
      match: {
        id: row.matchId,
        matchDate: row.matchDate,
        status: row.status,
        homeScore: row.homeScore,
        awayScore: row.awayScore,
        homeTeam: { name: row.homeTeamName, flag: row.homeTeamFlag },
        awayTeam: { name: row.awayTeamName, flag: row.awayTeamFlag },
      },
    }));
  }
}
