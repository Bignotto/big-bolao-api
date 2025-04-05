import { prisma } from '@/lib/prisma';
import { Prisma, Team } from '@prisma/client';
import { ITeamsRepository } from './ITeamsRepository';

export class PrismaTeamsRepository implements ITeamsRepository {
  async create(data: Prisma.TeamCreateInput): Promise<Team> {
    const team = await prisma.team.create({
      data,
    });

    return team;
  }

  async findById(id: number): Promise<Team | null> {
    const team = await prisma.team.findUnique({
      where: {
        id,
      },
    });

    return team;
  }

  async findByName(name: string): Promise<Team | null> {
    const team = await prisma.team.findFirst({
      where: {
        name,
      },
    });

    return team;
  }

  async findAll(): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return teams;
  }

  async update(id: number, data: Prisma.TeamUpdateInput): Promise<Team> {
    const team = await prisma.team.update({
      where: {
        id,
      },
      data,
    });

    return team;
  }

  async delete(id: number): Promise<void> {
    await prisma.team.delete({
      where: {
        id,
      },
    });
  }

  async findByCountryCode(countryCode: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: {
        countryCode,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return teams;
  }

  async findByTournamentId(tournamentId: number): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: {
        tournaments: {
          some: {
            tournamentId,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return teams;
  }
}
