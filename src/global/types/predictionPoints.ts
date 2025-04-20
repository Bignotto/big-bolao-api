export interface PredictionPoints {
  Prediction: number;
  poolId: number;
  userId: string;
  matchId: number;
  homeTeamScore: number;
  awayTeamScore: number;
  stage: string;
  matchStatus: string;
  predictedHome: number;
  predictedAway: number;
  predictedHasExtraTime: boolean;
  predictedHasPenalties: boolean;
  predictedHomePenalty: number | null;
  predictedAwayPenalty: number | null;
  exactScore: number;
  basepoints: number;
  stagemultiplier: number;
  TotalPoints: number;
}
