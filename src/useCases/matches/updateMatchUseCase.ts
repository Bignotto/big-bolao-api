import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { Match, MatchStage, MatchStatus } from '@prisma/client';

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
  }: UpdateMatchUseCaseRequest): Promise<Match> {
    // Check if match exists
    const match = await this.matchesRepository.findById(matchId);
    if (!match) {
      throw new ResourceNotFoundError('Match not found');
    }

    // Validate tournament exists
    const tournament = await this.tournamentsRepository.findById(match.tournamentId);
    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    // Validate scores
    if (homeScore !== undefined && homeScore < 0) {
      throw new Error('Home score cannot be negative');
    }

    if (awayScore !== undefined && awayScore < 0) {
      throw new Error('Away score cannot be negative');
    }

    console.log({ matchStage, hasExtraTime, hasPenalties });

    // Validate extra time and penalties
    if (hasExtraTime) {
      if (matchStage && matchStage === MatchStage.GROUP) {
        throw new Error('Group stage matches cannot have extra time');
      }
      if (match.stage && match.stage === MatchStage.GROUP) {
        throw new Error('Group stage matches cannot have extra time');
      }
    }

    if (matchStage && matchStage === MatchStage.GROUP && hasPenalties) {
      throw new Error('Group stage matches cannot have penalties');
    }

    // Validate penalties
    if (hasPenalties) {
      if (homeScore === undefined || awayScore === undefined) {
        throw new Error('Match scores must be provided when penalties are set');
      }

      if (homeScore !== awayScore) {
        throw new Error('Penalties can only occur when scores are tied after regular/extra time');
      }

      if (penaltyHomeScore === undefined || penaltyAwayScore === undefined) {
        throw new Error('Penalty scores must be provided when penalties are set');
      }

      if (penaltyHomeScore < 0 || penaltyAwayScore < 0) {
        throw new Error('Penalty scores cannot be negative');
      }

      if (penaltyHomeScore === penaltyAwayScore) {
        throw new Error('Penalty scores cannot be tied');
      }
    }

    // Validate match date cannot be in the past
    if (matchDate && matchDate < new Date()) {
      throw new Error('Match date cannot be in the past');
    }

    // Update match
    return this.matchesRepository.update(matchId, {
      homeTeam: { connect: { id: homeTeam } },
      awayTeam: { connect: { id: awayTeam } },
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
    });
  }
}
