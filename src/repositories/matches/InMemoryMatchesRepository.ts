import { Match, MatchStage, MatchStatus, Prisma } from '@prisma/client';
import { IMatchesRepository } from './IMatchesRepository';

export class InMemoryMatchesRepository implements IMatchesRepository {
  public matches: Match[] = [];

  async create(data: Prisma.MatchCreateInput): Promise<Match> {
    const newId = this.matches.length + 1;

    const match: Match = {
      id: newId,
      tournamentId: data.tournament.connect?.id as number,
      homeTeamId: data.homeTeam.connect?.id as number,
      awayTeamId: data.awayTeam.connect?.id as number,
      matchDatetime: data.matchDatetime as Date,
      stadium: data.stadium as string | null,
      stage: data.stage as MatchStage,
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

  async update(id: number, data: Prisma.MatchUpdateInput): Promise<Match> {
    const matchIndex = this.matches.findIndex((match) => match.id === id);

    if (matchIndex === -1) {
      throw new Error('Match not found');
    }

    const match = this.matches[matchIndex];

    const updatedMatch: Match = {
      ...match,
      homeTeamId: data.homeTeam ? (data.homeTeam.connect?.id as number) : match.homeTeamId,
      awayTeamId: data.awayTeam ? (data.awayTeam.connect?.id as number) : match.awayTeamId,
      matchDatetime: data.matchDatetime ? (data.matchDatetime as Date) : match.matchDatetime,
      stadium: data.stadium !== undefined ? (data.stadium as string) : match.stadium,
      stage: data.stage !== undefined ? (data.stage as MatchStage) : match.stage,
      homeTeamScore:
        data.homeTeamScore !== undefined ? (data.homeTeamScore as number) : match.homeTeamScore,
      awayTeamScore:
        data.awayTeamScore !== undefined ? (data.awayTeamScore as number) : match.awayTeamScore,
      matchStatus:
        data.matchStatus !== undefined ? (data.matchStatus as MatchStatus) : match.matchStatus,
      hasExtraTime:
        data.hasExtraTime !== undefined ? (data.hasExtraTime as boolean) : match.hasExtraTime,
      hasPenalties:
        data.hasPenalties !== undefined ? (data.hasPenalties as boolean) : match.hasPenalties,
      penaltyHomeScore:
        data.penaltyHomeScore !== undefined
          ? (data.penaltyHomeScore as number)
          : match.penaltyHomeScore,
      penaltyAwayScore:
        data.penaltyAwayScore !== undefined
          ? (data.penaltyAwayScore as number)
          : match.penaltyAwayScore,

      updatedAt: new Date(),
    };

    this.matches[matchIndex] = updatedMatch;
    return updatedMatch;
  }
}
