import { MatchStage } from '@prisma/client';

import { IMatchesRepository } from '@/repositories/matches/IMatchesRepository';

type FormResult = 'W' | 'D' | 'L';

interface RecentFormEntry {
  matchId: number;
  result: FormResult;
  teamScore: number;
  opponentScore: number;
  opponentId: number;
  opponentName: string;
  opponentCode: string | null;
  matchDatetime: Date;
  stage: MatchStage;
  decidedOnPenalties: boolean;
}

export interface GetTeamRecentFormResponse {
  teamId: number;
  results: RecentFormEntry[];
}

interface IGetTeamRecentFormRequest {
  teamId: number;
  limit: number;
}

export class GetTeamRecentFormUseCase {
  constructor(private matchesRepository: IMatchesRepository) {}

  async execute({ teamId, limit }: IGetTeamRecentFormRequest): Promise<GetTeamRecentFormResponse> {
    const matches = await this.matchesRepository.findRecentByTeamId(teamId, limit);

    const results: RecentFormEntry[] = matches.map((match) => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? (match.homeTeamScore ?? 0) : (match.awayTeamScore ?? 0);
      const opponentScore = isHome ? (match.awayTeamScore ?? 0) : (match.homeTeamScore ?? 0);
      const opponent = isHome ? match.awayTeam : match.homeTeam;

      const result: FormResult =
        teamScore > opponentScore ? 'W' : teamScore < opponentScore ? 'L' : 'D';

      return {
        matchId: match.id,
        result,
        teamScore,
        opponentScore,
        opponentId: opponent.id,
        opponentName: opponent.name,
        opponentCode: opponent.countryCode ?? null,
        matchDatetime: match.matchDatetime,
        stage: match.stage,
        decidedOnPenalties: match.hasPenalties,
      };
    });

    return { teamId, results };
  }
}
