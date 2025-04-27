export interface TournamentStatistics {
  poolId: number;
  name: string;
  tournamentId: number;
  groupMatches: number;
  finalMatches: number;
  knockOutMatches: number;
  totalMatches: number;
  possibleTotalPoints: number;
}
