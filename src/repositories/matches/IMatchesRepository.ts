import { Match, Team, Prisma } from '@prisma/client';

export type MatchWithTeams = Match & { homeTeam: Team; awayTeam: Team };

export interface IMatchesRepository {
  create(data: Prisma.MatchCreateInput): Promise<Match>;
  findById(id: number): Promise<Match | null>;
  findByTournamentId(tournamentId: number): Promise<MatchWithTeams[]>;
  findUpcomingMatches(tournamentId: number): Promise<Match[]>;
  findCompletedMatches(tournamentId: number): Promise<Match[]>;
  findRecentByTeamId(teamId: number, limit: number): Promise<MatchWithTeams[]>;
  update(id: number, data: Prisma.MatchUpdateInput): Promise<Match>;
  getMatchWithTeams(id: number): Promise<Match | null>;
}
