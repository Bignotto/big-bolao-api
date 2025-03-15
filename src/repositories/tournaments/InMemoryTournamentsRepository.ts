import { Prisma, Tournament } from '@prisma/client';
import { ITournamentsRepository } from './ITournamentsRepository';

export class InMemoryTournamentsRepository implements ITournamentsRepository {
  public tournaments: Tournament[] = [];
  async findById(id: number): Promise<Tournament | null> {
    const tournament = this.tournaments.find((t) => t.id === id);
    if (!tournament) {
      return null;
    }
    return tournament;
  }
  async create(data: Prisma.TournamentCreateInput): Promise<Tournament> {
    const newId = this.tournaments.length + 1;
    const tournament: Tournament = {
      id: newId,
      name: data.name,
      createdAt: new Date(),
      endDate: typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate,
      startDate: typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate,
      status: data.status ?? 'UPCOMING',
      logoUrl: data.logoUrl ?? '',
    };
    this.tournaments.push(tournament);
    return tournament;
  }
}
