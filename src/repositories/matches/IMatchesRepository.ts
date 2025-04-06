import { Match, Prisma } from '@prisma/client';

export interface IMatchesRepository {
  create(data: Prisma.MatchCreateInput): Promise<Match>;
  findById(id: number): Promise<Match | null>;
  findByTournamentId(tournamentId: number): Promise<Match[]>;
  findUpcomingMatches(tournamentId: number): Promise<Match[]>;
  findCompletedMatches(tournamentId: number): Promise<Match[]>;
  update(id: number, data: Prisma.MatchUpdateInput): Promise<Match>;
}
