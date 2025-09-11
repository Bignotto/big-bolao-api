import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { ITournamentsRepository } from './ITournamentsRepository';

export class PrismaTournamentsRepository implements ITournamentsRepository {
  async findById(id: number) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });
    return tournament;
  }

  async create(data: Prisma.TournamentCreateInput) {
    const tournament = await prisma.tournament.create({
      data,
    });
    return tournament;
  }

  async list() {
    const tournaments = await prisma.tournament.findMany();
    return tournaments;
  }
}
