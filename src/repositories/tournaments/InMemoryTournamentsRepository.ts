import { Prisma, Tournament } from '@prisma/client';

import { ITournamentsRepository } from './ITournamentsRepository';

export class InMemoryTournamentsRepository implements ITournamentsRepository {
  public tournaments: Tournament[] = [];
  findById(id: number): Promise<Tournament | null> {
    const tournament = this.tournaments.find((t) => t.id === id);
    if (!tournament) {
      return Promise.resolve(null);
    }
    return Promise.resolve(tournament);
  }
  create(data: Prisma.TournamentCreateInput): Promise<Tournament> {
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
    return Promise.resolve(tournament);
  }

  list(): Promise<Tournament[]> {
    return Promise.resolve(this.tournaments);
  }

  async getDetails(id: number) {
    const tournament = await this.findById(id);
    if (!tournament) return null;
    // In-memory repo doesn't track relations; return zeros for counts
    return {
      ...tournament,
      totalMatches: 0,
      completedMatches: 0,
      totalTeams: 0,
      totalPools: 0,
    };
  }
}
