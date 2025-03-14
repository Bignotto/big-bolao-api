import { prisma } from '@/lib/prisma';
import { ITournamentsRepository } from './ITournamentsRepository';

export class PrismaTournamentsRepository implements ITournamentsRepository {
  async findById(id: number) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });
    return tournament;
  }
}
