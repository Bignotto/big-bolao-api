import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface KnockoutMatchData {
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  stage: MatchStage;
  stadium: string;
  homeScore: number;
  awayScore: number;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
}

export async function createKnockoutMatches(
  tournamentId: number,
  teamMap: { [key: string]: number }
) {
  const knockoutMatches: KnockoutMatchData[] = [
    // Round of 16
    {
      homeTeam: 'Netherlands',
      awayTeam: 'USA',
      datetime: '2022-12-03T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Khalifa International Stadium',
      homeScore: 3,
      awayScore: 1,
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Australia',
      datetime: '2022-12-03T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Poland',
      datetime: '2022-12-04T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Thumama Stadium',
      homeScore: 3,
      awayScore: 1,
    },
    {
      homeTeam: 'England',
      awayTeam: 'Senegal',
      datetime: '2022-12-04T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Bayt Stadium',
      homeScore: 3,
      awayScore: 0,
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'Croatia',
      datetime: '2022-12-05T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Janoub Stadium',
      homeScore: 1,
      awayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 1,
      penaltyAwayScore: 3,
    },
    {
      homeTeam: 'Brazil',
      awayTeam: 'South Korea',
      datetime: '2022-12-05T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Stadium 974',
      homeScore: 4,
      awayScore: 1,
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Spain',
      datetime: '2022-12-06T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Education City Stadium',
      homeScore: 0,
      awayScore: 0,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 3,
      penaltyAwayScore: 0,
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Switzerland',
      datetime: '2022-12-06T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Lusail Stadium',
      homeScore: 6,
      awayScore: 1,
    },

    // Quarter-finals
    {
      homeTeam: 'Croatia',
      awayTeam: 'Brazil',
      datetime: '2022-12-09T15:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Education City Stadium',
      homeScore: 1,
      awayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 4,
      penaltyAwayScore: 2,
    },
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Argentina',
      datetime: '2022-12-09T19:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 2,
      awayScore: 2,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 3,
      penaltyAwayScore: 4,
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Portugal',
      datetime: '2022-12-10T15:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Al Thumama Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'England',
      awayTeam: 'France',
      datetime: '2022-12-10T19:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Al Bayt Stadium',
      homeScore: 1,
      awayScore: 2,
    },

    // Semi-finals
    {
      homeTeam: 'Argentina',
      awayTeam: 'Croatia',
      datetime: '2022-12-13T19:00:00Z',
      stage: MatchStage.SEMI_FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 3,
      awayScore: 0,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Morocco',
      datetime: '2022-12-14T19:00:00Z',
      stage: MatchStage.SEMI_FINAL,
      stadium: 'Al Bayt Stadium',
      homeScore: 2,
      awayScore: 0,
    },

    // Third place play-off
    {
      homeTeam: 'Croatia',
      awayTeam: 'Morocco',
      datetime: '2022-12-17T15:00:00Z',
      stage: MatchStage.THIRD_PLACE,
      stadium: 'Khalifa International Stadium',
      homeScore: 2,
      awayScore: 1,
    },

    // Final
    {
      homeTeam: 'Argentina',
      awayTeam: 'France',
      datetime: '2022-12-18T15:00:00Z',
      stage: MatchStage.FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 3,
      awayScore: 3,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 4,
      penaltyAwayScore: 2,
    },
  ];

  for (const match of knockoutMatches) {
    await prisma.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: teamMap[match.homeTeam],
        awayTeamId: teamMap[match.awayTeam],
        matchDatetime: new Date(match.datetime),
        stadium: match.stadium,
        stage: match.stage,
        homeTeamScore: match.homeScore,
        awayTeamScore: match.awayScore,
        matchStatus: MatchStatus.COMPLETED,
        hasExtraTime: match.hasExtraTime || false,
        hasPenalties: match.hasPenalties || false,
        penaltyHomeScore: match.penaltyHomeScore,
        penaltyAwayScore: match.penaltyAwayScore,
      },
    });
    console.log(`Created knockout match: ${match.homeTeam} vs ${match.awayTeam}`);
  }
}

