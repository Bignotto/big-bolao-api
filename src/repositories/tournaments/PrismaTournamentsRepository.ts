import { MatchStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { ITournamentsRepository } from './ITournamentsRepository';

export class PrismaTournamentsRepository implements ITournamentsRepository {
  async findById(id: number): Promise<import('@prisma/client').Tournament | null> {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });
    return tournament;
  }

  async create(data: Prisma.TournamentCreateInput): Promise<import('@prisma/client').Tournament> {
    const tournament = await prisma.tournament.create({
      data,
    });
    return tournament;
  }

  async list(): Promise<import('@prisma/client').Tournament[]> {
    const tournaments = await prisma.tournament.findMany();
    return tournaments;
  }

  async getDetails(
    id: number
  ): Promise<
    | (import('@prisma/client').Tournament & {
        totalMatches: number;
        completedMatches: number;
        totalTeams: number;
        totalPools: number;
      })
    | null
  > {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            matches: true,
            teams: true, // counts TournamentTeam entries
            pools: true,
          },
        },
      },
    });

    if (!tournament) return null;

    const completedMatches = await prisma.match.count({
      where: { tournamentId: id, matchStatus: MatchStatus.COMPLETED },
    });

    return {
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      logoUrl: tournament.logoUrl,
      status: tournament.status,
      createdAt: tournament.createdAt,
      totalMatches: tournament._count.matches,
      completedMatches,
      totalTeams: tournament._count.teams,
      totalPools: tournament._count.pools,
    };
  }
}
