export interface PoolStandings {
  ranking: string;
  fullName: string;
  profileImageUrl: string | null;
  userId: string;
  poolId: number;
  totalPredictions: number;
  totalPoints: number;
  exactScoreCount: number;
  pointsRatio: number;
  guessRatio: number;
  predictionsRatio: number;
}
