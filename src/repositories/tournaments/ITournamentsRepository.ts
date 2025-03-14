import { Tournament } from '@prisma/client';

export interface ITournamentsRepository {
  findById(id: number): Promise<Tournament | null>;
}
