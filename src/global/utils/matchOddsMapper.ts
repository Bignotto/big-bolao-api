import { MatchOdds, MatchOddsRaw, MatchOddsStats } from '@/global/types/matchOdds';

export function computeStats(
  homeWins: bigint,
  draws: bigint,
  awayWins: bigint,
  total: bigint
): MatchOddsStats {
  const t = Number(total);
  if (t === 0) {
    return { total: 0, homeWinsPercentage: 0, drawPercentage: 0, awayWinsPercentage: 0 };
  }
  return {
    total: t,
    homeWinsPercentage: Math.round((Number(homeWins) * 10000) / t) / 100,
    drawPercentage: Math.round((Number(draws) * 10000) / t) / 100,
    awayWinsPercentage: Math.round((Number(awayWins) * 10000) / t) / 100,
  };
}

export function mapRawToMatchOdds(raw: MatchOddsRaw): MatchOdds {
  return {
    matchId: Number(raw.matchId),
    homeTeam: {
      id: Number(raw.homeTeamId),
      name: raw.homeTeamName,
      countryCode: raw.homeTeamCountryCode,
      flagUrl: raw.homeTeamFlagUrl,
    },
    awayTeam: {
      id: Number(raw.awayTeamId),
      name: raw.awayTeamName,
      countryCode: raw.awayTeamCountryCode,
      flagUrl: raw.awayTeamFlagUrl,
    },
    global: computeStats(raw.globalHomeWins, raw.globalDraws, raw.globalAwayWins, raw.globalTotal),
    pool: computeStats(raw.poolHomeWins, raw.poolDraws, raw.poolAwayWins, raw.poolTotal),
  };
}
