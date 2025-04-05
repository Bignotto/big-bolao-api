import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';
import { Match, MatchStage, MatchStatus, Team } from '@prisma/client';

export async function createMatch(
  repository: IMatchesRepository,
  data: {
    tournamentId?: number;
    matchDatetime?: Date;
    stadium?: string;
    homeTeamScore?: number;
    awayTeamScore?: number;
    matchStatus?: MatchStatus;
    matchStage?: MatchStage;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    penaltyHomeScore?: number;
    penaltyAwayScore?: number;
  },
  homeTeam: Team,
  awayTeam: Team
): Promise<Match> {
  const randomMatchNumber = Math.floor(Math.random() * 100);

  const match = await repository.create({
    tournament: { connect: { id: data.tournamentId ?? Math.floor(Math.random() * 100) } },
    matchDatetime: new Date('2026-06-15T15:00:00Z'),
    stadium: data.stadium ?? `Stadium ${randomMatchNumber}`,
    stage: data.matchStage ?? MatchStage.GROUP,
    homeTeam: { connect: { id: homeTeam.id } },
    awayTeam: { connect: { id: awayTeam.id } },
    homeTeamScore: data.homeTeamScore ?? 0,
    awayTeamScore: data.awayTeamScore ?? 0,
    matchStatus: data.matchStatus ?? MatchStatus.SCHEDULED,
    hasExtraTime: data.hasExtraTime ?? false,
    hasPenalties: data.hasPenalties ?? false,
    penaltyHomeScore: data.penaltyHomeScore ?? 0,
    penaltyAwayScore: data.penaltyAwayScore ?? 0,
  });
  return match;
}

export async function createMatchWithTeams(
  repositories: {
    matchesRepository: IMatchesRepository;
    teamsRepository: ITeamsRepository;
  },

  data: {
    tournamentId?: number;
    matchDatetime?: Date;
    stadium?: string;
    homeTeamScore?: number;
    awayTeamScore?: number;
    matchStatus?: MatchStatus;
    matchStage?: MatchStage;
    hasExtraTime?: boolean;
    hasPenalties?: boolean;
    penaltyHomeScore?: number;
    penaltyAwayScore?: number;
  }
): Promise<{
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
}> {
  const homeTeam = await repositories.teamsRepository.create({
    name: 'Brazil',
    countryCode: 'BRA',
  });

  const awayTeam = await repositories.teamsRepository.create({
    name: 'Argentina',
    countryCode: 'ARG',
  });

  const match = await createMatch(repositories.matchesRepository, data, homeTeam, awayTeam);

  return {
    match,
    homeTeam,
    awayTeam,
  };
}
