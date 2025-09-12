import { Prisma, Tournament } from '@prisma/client';

export interface ITournamentsRepository {
  findById(id: number): Promise<Tournament | null>;
  create(data: Prisma.TournamentCreateInput): Promise<Tournament>;
  list(): Promise<Tournament[]>;
  getDetails(
    id: number
  ): Promise<
    | (Tournament & {
        totalMatches: number;
        completedMatches: number;
        totalTeams: number;
        totalPools: number;
      })
    | null
  >;
}
