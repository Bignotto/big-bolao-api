import { Match, Pool, Prediction, Prisma, ScoringRule } from '@prisma/client';

import { PoolStandings } from '@/global/types/poolStandings';
import { PredictionPoints } from '@/global/types/predictionPoints';
import { IPoolsRepository, PoolCompleteInfo } from './IPoolsRepository';

export class InMemoryPoolsRepository implements IPoolsRepository {
  public pools: Pool[] = [];
  public scoringRules: ScoringRule[] = [];
  public participants: { poolId: number; userId: string; joinedAt: Date }[] = [];
  public predictions: Prediction[] = [];
  public matches: Match[] = [];
  public poolStandings: PoolStandings[] = [];

  /*
  This method could have only produced a mock-up for pool standings, but... 
  */
  async getPoolStandings(poolId: number): Promise<PoolStandings[]> {
    if (this.predictions.length === 0) {
      throw new Error('No predictions found');
    }
    if (this.scoringRules.length === 0) {
      throw new Error('No scoring rules found');
    }
    if (this.matches.length === 0) {
      throw new Error('No matches found');
    }

    const poolPredictions = this.predictions.filter((prediction) => prediction.poolId === poolId);
    if (poolPredictions.length === 0) {
      throw new Error('No predictions found for this pool');
    }

    const predictionsPoints: PredictionPoints[] = [];
    let summary: { [id: string]: PoolStandings } = {};

    for (const prediction of poolPredictions) {
      const match = this.matches.find((match) => match.id === prediction.matchId);
      if (!match) {
        throw new Error('Match not found for prediction');
      }

      let basepoints = 0;
      switch (true) {
        case prediction.predictedHomeScore === match?.homeTeamScore &&
          prediction.predictedAwayScore === match?.awayTeamScore:
          basepoints = this.scoringRules[0].exactScorePoints; // Exact score
          break;

        case prediction.predictedHomeScore === prediction.predictedAwayScore &&
          (match?.homeTeamScore ?? 0) === (match?.awayTeamScore ?? 0):
          basepoints = this.scoringRules[0].correctDrawPoints; // Correct draw
          break;

        case Math.sign(prediction.predictedHomeScore - prediction.predictedAwayScore) ===
          Math.sign((match?.homeTeamScore ?? 0) - (match?.awayTeamScore ?? 0)) &&
          prediction.predictedHomeScore - prediction.predictedAwayScore ===
            (match?.homeTeamScore ?? 0) - (match?.awayTeamScore ?? 0):
          basepoints = this.scoringRules[0].correctWinnerGoalDiffPoints; // Correct winner and goal diff
          break;

        case prediction.predictedHomeScore > prediction.predictedAwayScore &&
          (match?.homeTeamScore ?? 0) > (match?.awayTeamScore ?? 0):
          basepoints = this.scoringRules[0].correctWinnerPoints; // Correct winner
          break;

        case (prediction.predictedAwayScore > prediction.predictedHomeScore &&
          match?.awayTeamScore) ??
          0 > (match?.homeTeamScore ?? 0):
          basepoints = this.scoringRules[0].correctWinnerPoints; // Correct winner
          break;

        default:
          basepoints = 0; // Wrong prediction
      }

      let stagemultiplier = 1;
      switch (true) {
        case match.stage === 'FINAL':
          stagemultiplier = this.scoringRules[0].finalMultiplier.toNumber();
          break;
        case match.stage !== 'GROUP':
          stagemultiplier = this.scoringRules[0].knockoutMultiplier.toNumber();
          break;
        default:
          stagemultiplier = 1;
          break;
      }

      predictionsPoints.push({
        Prediction: 0,
        poolId,
        matchId: match ? match.id : 0,
        userId: prediction.userId,
        homeTeamScore: match?.homeTeamScore ?? 0,
        awayTeamScore: match?.awayTeamScore ?? 0,
        stage: match?.stage ?? '',
        matchStatus: match?.matchStatus ?? '',
        predictedHome: prediction.predictedPenaltyHomeScore ?? 0,
        predictedAway: prediction.predictedPenaltyAwayScore ?? 0,
        predictedHasExtraTime: prediction.predictedHasExtraTime,
        predictedHasPenalties: prediction.predictedHasPenalties,
        predictedHomePenalty: prediction.predictedPenaltyHomeScore,
        predictedAwayPenalty: prediction.predictedPenaltyAwayScore,
        exactScore:
          prediction.predictedHomeScore === match?.homeTeamScore &&
          prediction.predictedAwayScore === match?.awayTeamScore
            ? 1
            : 0,
        basepoints,
        stagemultiplier,
        TotalPoints: basepoints * stagemultiplier,
      });
      if (summary[prediction.userId]) {
        summary[prediction.userId].totalPoints += basepoints * stagemultiplier;
      } else {
        summary[prediction.userId] = {
          userId: prediction.userId,
          poolId,
          totalPoints: basepoints * stagemultiplier,
          exactScoreCount: 0,
          fullName: '',
          guessRatio: 0,
          pointsRatio: 0,
          predictionsRatio: 0,
          profileImageUrl: '',
          ranking: '0',
          totalPredictions: 0,
        };
      }
    }
    return Object.values(summary);
  }
  async create(data: Prisma.PoolCreateInput): Promise<Pool> {
    const newId = this.pools.length + 1;

    const pool: Pool = {
      id: newId,
      name: data.name,
      tournamentId: data.tournament.connect?.id as number,
      inviteCode: data.inviteCode ?? 'CONVITE',
      createdAt: new Date(),
      creatorId: data.creator.connect?.id || '',
      description: data.description ?? '',
      isPrivate: data.isPrivate as boolean,
      maxParticipants: data.maxParticipants as number,
      registrationDeadline: data.registrationDeadline as Date,
    };

    this.pools.push(pool);
    return pool;
  }

  async getScoringRules(poolId: number): Promise<ScoringRule[]> {
    return this.scoringRules.filter((rule) => rule.poolId === poolId);
  }

  async getPoolParticipants(poolId: number): Promise<{ poolId: number; userId: string }[]> {
    return this.participants.filter((participant) => participant.poolId === poolId);
  }

  async getPool(poolId: number): Promise<PoolCompleteInfo | null> {
    const participants = this.participants.filter((participant) => participant.poolId === poolId);
    const pool = this.pools.find((pool) => pool.id === poolId);
    const scoringRules = this.scoringRules.filter((rule) => rule.poolId === poolId);

    if (!pool) {
      return null;
    }

    return {
      ...pool,
      participants,
      scoringRules: scoringRules[0],
    };
  }

  async update(id: number, data: Prisma.PoolUpdateInput): Promise<Pool> {
    const poolIndex = this.pools.findIndex((pool) => pool.id === id);
    if (poolIndex === -1) {
      throw new Error('Pool not found');
    }

    const updatedPool: Pool = {
      ...this.pools[poolIndex],
      name: typeof data.name === 'string' ? data.name : this.pools[poolIndex].name,
      description:
        typeof data.description === 'string' ? data.description : this.pools[poolIndex].description,
      isPrivate:
        typeof data.isPrivate === 'boolean' ? data.isPrivate : this.pools[poolIndex].isPrivate,
      inviteCode:
        typeof data.inviteCode === 'string' ? data.inviteCode : this.pools[poolIndex].inviteCode,
      maxParticipants:
        typeof data.maxParticipants === 'number'
          ? data.maxParticipants
          : this.pools[poolIndex].maxParticipants,
      registrationDeadline:
        data.registrationDeadline instanceof Date
          ? data.registrationDeadline
          : this.pools[poolIndex].registrationDeadline,
      tournamentId: data.tournament?.connect?.id ?? this.pools[poolIndex].tournamentId,
      creatorId: data.creator?.connect?.id ?? this.pools[poolIndex].creatorId,
      createdAt: this.pools[poolIndex].createdAt,
      id: this.pools[poolIndex].id,
    };

    this.pools[poolIndex] = updatedPool as Pool;
    return updatedPool as Pool;
  }

  async createScoringRules(data: Prisma.ScoringRuleCreateInput): Promise<ScoringRule> {
    const newId = this.scoringRules.length + 1;

    const scoringRule: ScoringRule = {
      id: newId,
      poolId: data.pool.connect?.id as number,
      correctDrawPoints: data.correctDrawPoints as number,
      correctWinnerGoalDiffPoints: data.correctWinnerGoalDiffPoints as number,
      correctWinnerPoints: data.correctWinnerPoints as number,
      exactScorePoints: data.exactScorePoints as number,
      finalMultiplier: new Prisma.Decimal(data.finalMultiplier as number),
      knockoutMultiplier: new Prisma.Decimal(data.knockoutMultiplier as number),
      specialEventPoints: data.specialEventPoints as number,
    };

    this.scoringRules.push(scoringRule);
    return scoringRule;
  }

  async addParticipant(data: { poolId: number; userId: string }): Promise<void> {
    this.participants.push({ ...data, joinedAt: new Date() });
  }

  async findById(id: number): Promise<Pool | null> {
    const pool = this.pools.find((pool) => pool.id === id);
    return pool || null;
  }

  async findByInviteCode(inviteCode: string): Promise<Pool | null> {
    const pool = this.pools.find((pool) => pool.inviteCode === inviteCode);
    return pool || null;
  }

  async findByCreatorId(creatorId: string): Promise<Pool[]> {
    return this.pools.filter((pool) => pool.creatorId === creatorId);
  }

  async findByParticipantId(userId: string): Promise<Pool[]> {
    const participantPoolIds = this.participants
      .filter((participant) => participant.userId === userId)
      .map((participant) => participant.poolId);

    return this.pools.filter(
      (pool) => participantPoolIds.includes(pool.id) || pool.creatorId === userId
    );
  }

  async removeParticipant({ poolId, userId }: { poolId: number; userId: string }) {
    const participantIndex = this.participants.findIndex(
      (participant) => participant.poolId === poolId && participant.userId === userId
    );

    if (participantIndex === -1) {
      throw new Error('Participant not found');
    }

    this.participants.splice(participantIndex, 1);
  }
}
