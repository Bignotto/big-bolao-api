export interface MatchOddsRaw {
  matchId: bigint;
  homeTeamId: bigint;
  homeTeamName: string;
  homeTeamCountryCode: string | null;
  homeTeamFlagUrl: string | null;
  awayTeamId: bigint;
  awayTeamName: string;
  awayTeamCountryCode: string | null;
  awayTeamFlagUrl: string | null;
  globalHomeWins: bigint;
  globalDraws: bigint;
  globalAwayWins: bigint;
  globalTotal: bigint;
  poolHomeWins: bigint;
  poolDraws: bigint;
  poolAwayWins: bigint;
  poolTotal: bigint;
}

export interface MatchOddsStats {
  total: number;
  homeWinsPercentage: number;
  drawPercentage: number;
  awayWinsPercentage: number;
}

export interface MatchOdds {
  matchId: number;
  homeTeam: { id: number; name: string; countryCode: string | null; flagUrl: string | null };
  awayTeam: { id: number; name: string; countryCode: string | null; flagUrl: string | null };
  global: MatchOddsStats;
  pool: MatchOddsStats;
}
