import { Match, MatchStatus, Prisma } from '@prisma/client';

import { IMatchesRepository } from './IMatchesRepository';
import { prisma } from '../../lib/prisma';

export class PrismaMatchesRepository implements IMatchesRepository {
  async create(data: Prisma.MatchCreateInput): Promise<Match> {
    const match = await prisma.match.create({
      data,
    });

    return match;
  }

  async findById(id: number): Promise<Match | null> {
    const match = await prisma.match.findUnique({
      where: { id },
    });

    return match;
  }

  async findByTournamentId(tournamentId: number): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: { matchDatetime: 'asc' },
    });

    return matches;
  }

  async findUpcomingMatches(tournamentId: number): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
      },
      orderBy: { matchDatetime: 'asc' },
    });

    return matches;
  }

  async findCompletedMatches(tournamentId: number): Promise<Match[]> {
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        matchStatus: MatchStatus.COMPLETED,
      },
      orderBy: { matchDatetime: 'desc' },
    });

    return matches;
  }

  async update(id: number, data: Prisma.MatchUpdateInput): Promise<Match> {
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return match;
  }

  async getMatchWithTeams(id: number): Promise<Match | null> {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: true,
      },
    });

    return match;
  }
}
