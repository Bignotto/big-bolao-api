import { Prisma, Tournament } from '@prisma/client';

export interface ITournamentsRepository {
  findById(id: number): Promise<Tournament | null>;
  create(data: Prisma.TournamentCreateInput): Promise<Tournament>;
}
