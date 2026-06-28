import { Prediction, Prisma } from '@prisma/client';

import { MatchOddsRaw } from '@/global/types/matchOdds';

export interface UserPredictionWithPoints {
  predictionId: number;
  matchId: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedHasExtraTime: boolean;
  predictedHasPenalties: boolean;
  pointsEarned: number;
  exactScore: boolean;
  correctWinner: boolean;
  match: {
    id: number;
    matchDate: Date;
    status: string;
    homeScore: number;
    awayScore: number;
    homeTeam: { name: string; flag: string | null };
    awayTeam: { name: string; flag: string | null };
  };
}

export interface IPredictionsRepository {
  create(data: Prisma.PredictionCreateInput): Promise<Prediction>;
  findById(id: number): Promise<Prediction | null>;
  findByUserMatchAndPool(
    userId: string,
    matchId: number,
    poolId: number
  ): Promise<Prediction | null>;
  update(id: number, data: Prisma.PredictionUpdateInput): Promise<Prediction>;
  delete(id: number): Promise<void>;
  findByMatchId(matchId: number): Promise<Prediction[]>;
  findByUserId(userId: string, poolId?: number): Promise<Prediction[]>;
  findByPoolId(poolId: number): Promise<Prediction[]>; // New method
  findByPoolIdAndMatchId(poolId: number, matchId: number): Promise<Prediction[]>;
  getMatchOdds(poolId: number, tournamentId: number): Promise<MatchOddsRaw[]>;
  getMatchOddsByMatchId(poolId: number, tournamentId: number, matchId: number): Promise<MatchOddsRaw | null>;
  findCompletedWithPointsByUserAndPool(userId: string, poolId: number): Promise<UserPredictionWithPoints[]>;
}
