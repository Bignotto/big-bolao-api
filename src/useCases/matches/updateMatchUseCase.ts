import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { Match, MatchStage, MatchStatus } from '@prisma/client';
import { MatchUpdateError } from './errors/MatchUpdateError';

interface UpdateMatchUseCaseRequest {
  matchId: number;
  homeTeam?: number;
  awayTeam?: number;
  homeScore?: number;
  awayScore?: number;
  matchDate?: Date;
  matchStatus?: MatchStatus;
  matchStage?: MatchStage;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
  stadium?: string;
}

export class UpdateMatchUseCase {
  constructor(
    private matchesRepository: IMatchesRepository,
    private tournamentsRepository: ITournamentsRepository
  ) {}

  async execute({
    matchId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    matchDate,
    matchStatus,
    matchStage,
    hasExtraTime,
    hasPenalties,
    penaltyHomeScore,
    penaltyAwayScore,
    stadium,
  }: UpdateMatchUseCaseRequest): Promise<Match> {
    const match = await this.matchesRepository.findById(matchId);
    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    const tournament = await this.tournamentsRepository.findById(match.tournamentId);
    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    if (matchStatus === MatchStatus.SCHEDULED) {
      if (homeScore !== undefined || awayScore !== undefined || hasExtraTime || hasPenalties) {
        throw new MatchUpdateError(
          'Cannot set score, extra time, or penalties for a scheduled match'
        );
      }
    }

    if (!matchStatus && match.matchStatus === MatchStatus.SCHEDULED) {
      if (homeScore !== undefined || awayScore !== undefined || hasExtraTime || hasPenalties) {
        throw new MatchUpdateError(
          'Cannot set score, extra time, or penalties for a scheduled match'
        );
      }
    }

    if (homeScore !== undefined && homeScore < 0) {
      throw new MatchUpdateError('Home score cannot be negative');
    }

    if (awayScore !== undefined && awayScore < 0) {
      throw new MatchUpdateError('Away score cannot be negative');
    }

    if (hasExtraTime) {
      if (matchStage && matchStage === MatchStage.GROUP) {
        throw new MatchUpdateError('Group stage matches cannot have extra time');
      }
      if (!matchStage && match.stage && match.stage === MatchStage.GROUP) {
        throw new MatchUpdateError('Group stage matches cannot have extra time');
      }
    }

    if (hasPenalties) {
      if (!hasExtraTime) {
        throw new MatchUpdateError('Penalties can only be set when extra time is set');
      }

      if (matchStage && matchStage === MatchStage.GROUP) {
        throw new MatchUpdateError('Group stage matches cannot have penalties');
      }

      if (!matchStage && match.stage && match.stage === MatchStage.GROUP) {
        throw new MatchUpdateError('Group stage matches cannot have penalties');
      }

      if (homeScore === undefined || awayScore === undefined) {
        throw new MatchUpdateError('Match scores must be provided when penalties are set');
      }

      if (homeScore !== awayScore) {
        throw new MatchUpdateError(
          'Penalties can only occur when scores are tied after regular/extra time'
        );
      }

      if (penaltyHomeScore === undefined || penaltyAwayScore === undefined) {
        throw new MatchUpdateError('Penalty scores must be provided when penalties are set');
      }

      if (penaltyHomeScore < 0 || penaltyAwayScore < 0) {
        throw new MatchUpdateError('Penalty scores cannot be negative');
      }

      if (penaltyHomeScore === penaltyAwayScore) {
        throw new MatchUpdateError('Penalty scores cannot be tied');
      }
    }

    if (matchDate && matchDate < new Date()) {
      throw new MatchUpdateError('Match date cannot be in the past');
    }

    const updatedMatch = await this.matchesRepository.update(matchId, {
      homeTeam: homeTeam ? { connect: { id: homeTeam } } : undefined,
      awayTeam: awayTeam ? { connect: { id: awayTeam } } : undefined,
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      matchDatetime: matchDate,
      matchStatus: matchStatus,
      stage: matchStage,
      hasExtraTime: hasExtraTime,
      hasPenalties: hasPenalties,
      penaltyHomeScore: penaltyHomeScore,
      penaltyAwayScore: penaltyAwayScore,
      updatedAt: new Date(),
      stadium,
    });

    return updatedMatch;
  }
}
