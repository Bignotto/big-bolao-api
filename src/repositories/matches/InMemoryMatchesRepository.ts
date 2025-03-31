import { Match, MatchStatus, Prisma } from '@prisma/client';
import { IMatchesRepository } from './IMatchesRepository';

export class InMemoryMatchesRepository implements IMatchesRepository {
  private matches: Match[] = [];

  async create(data: Prisma.MatchCreateInput): Promise<Match> {
    const newId = this.matches.length + 1;

    const match: Match = {
      id: newId,
      tournamentId: data.tournament.connect?.id as number,
      homeTeamId: data.homeTeam.connect?.id as number,
      awayTeamId: data.awayTeam.connect?.id as number,
      matchDatetime: data.matchDatetime as Date,
      stadium: data.stadium as string | null,
      stage: data.stage as string,
      homeTeamScore: data.homeTeamScore as number | null,
      awayTeamScore: data.awayTeamScore as number | null,
      matchStatus: (data.matchStatus as MatchStatus) || MatchStatus.SCHEDULED,
      hasExtraTime: (data.hasExtraTime as boolean) || false,
      hasPenalties: (data.hasPenalties as boolean) || false,
      penaltyHomeScore: data.penaltyHomeScore as number | null,
      penaltyAwayScore: data.penaltyAwayScore as number | null,
      createdAt: new Date(),
      updatedAt: null,
    };

    this.matches.push(match);
    return match;
  }

  async findById(id: number): Promise<Match | null> {
    const match = this.matches.find((match) => match.id === id);
    return match || null;
  }

  async findByTournamentId(tournamentId: number): Promise<Match[]> {
    const matches = this.matches
      .filter((match) => match.tournamentId === tournamentId)
      .sort((a, b) => a.matchDatetime.getTime() - b.matchDatetime.getTime());

    return matches;
  }

  async findUpcomingMatches(tournamentId: number): Promise<Match[]> {
    const matches = this.matches
      .filter(
        (match) =>
          match.tournamentId === tournamentId && match.matchStatus === MatchStatus.SCHEDULED
      )
      .sort((a, b) => a.matchDatetime.getTime() - b.matchDatetime.getTime());

    return matches;
  }

  async findCompletedMatches(tournamentId: number): Promise<Match[]> {
    const matches = this.matches
      .filter(
        (match) =>
          match.tournamentId === tournamentId && match.matchStatus === MatchStatus.COMPLETED
      )
      .sort((a, b) => b.matchDatetime.getTime() - a.matchDatetime.getTime());

    return matches;
  }
}
