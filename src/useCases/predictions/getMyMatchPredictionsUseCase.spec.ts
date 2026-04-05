import { MatchStage, MatchStatus } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';

import { GetMyMatchPredictionsUseCase } from './getMyMatchPredictionsUseCase';

const TOURNAMENT_ID = 1;
const MATCH_ID = 42;
const USER_ID = 'user-01';
const OTHER_USER_ID = 'user-02';

describe('GetMyMatchPredictionsUseCase', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let predictionsRepository: InMemoryPredictionsRepository;
  let sut: GetMyMatchPredictionsUseCase;

  beforeEach(() => {
    matchesRepository = new InMemoryMatchesRepository();
    poolsRepository = new InMemoryPoolsRepository();
    predictionsRepository = new InMemoryPredictionsRepository();

    sut = new GetMyMatchPredictionsUseCase(matchesRepository, poolsRepository);

    matchesRepository.matches.push({
      id: MATCH_ID,
      tournamentId: TOURNAMENT_ID,
      homeTeamId: 1,
      awayTeamId: 2,
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stadium: null,
      stage: MatchStage.GROUP,
      group: null,
      homeTeamScore: null,
      awayTeamScore: null,
      matchStatus: MatchStatus.SCHEDULED,
      hasExtraTime: false,
      hasPenalties: false,
      penaltyHomeScore: null,
      penaltyAwayScore: null,
      createdAt: new Date(),
      updatedAt: null,
    });
  });

  it('should return one entry per pool the user belongs to', async () => {
    await createPool(poolsRepository, { tournamentId: TOURNAMENT_ID, creatorId: USER_ID });
    await createPool(poolsRepository, { tournamentId: TOURNAMENT_ID, creatorId: USER_ID });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toHaveLength(2);
  });

  it('should include a prediction object where one was submitted', async () => {
    const pool = await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID,
      creatorId: USER_ID,
    });

    await createPrediction(predictionsRepository, {
      userId: USER_ID,
      matchId: MATCH_ID,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].prediction).not.toBeNull();
    expect(predictions[0].prediction?.predictedHomeScore).toBe(2);
    expect(predictions[0].prediction?.predictedAwayScore).toBe(1);
    expect(predictions[0].poolId).toBe(pool.id);
    expect(predictions[0].matchId).toBe(MATCH_ID);
  });

  it('should set prediction to null where no prediction was submitted', async () => {
    await createPool(poolsRepository, { tournamentId: TOURNAMENT_ID, creatorId: USER_ID });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].prediction).toBeNull();
  });

  it('should mix pools with and without predictions correctly', async () => {
    const poolA = await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID,
      creatorId: USER_ID,
    });
    const poolB = await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID,
      creatorId: USER_ID,
    });

    await createPrediction(predictionsRepository, {
      userId: USER_ID,
      matchId: MATCH_ID,
      poolId: poolA.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    const entryA = predictions.find((p) => p.poolId === poolA.id);
    const entryB = predictions.find((p) => p.poolId === poolB.id);

    expect(entryA?.prediction).not.toBeNull();
    expect(entryA?.prediction?.predictedHomeScore).toBe(3);
    expect(entryB?.prediction).toBeNull();
  });

  it('should return an empty array when user belongs to no pools for the tournament', async () => {
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toEqual([]);
  });

  it('should throw ResourceNotFoundError when match does not exist', async () => {
    await expect(sut.execute({ matchId: 999, userId: USER_ID })).rejects.toBeInstanceOf(
      ResourceNotFoundError
    );
  });

  it('should not include pools from a different tournament', async () => {
    await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID + 99,
      creatorId: USER_ID,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toEqual([]);
  });

  it('should not include pools where the user is not a participant', async () => {
    await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID,
      creatorId: OTHER_USER_ID,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toEqual([]);
  });

  it('should not include predictions from other users in the same pool', async () => {
    const pool = await createPool(poolsRepository, {
      tournamentId: TOURNAMENT_ID,
      creatorId: USER_ID,
    });

    await createPrediction(predictionsRepository, {
      userId: OTHER_USER_ID,
      matchId: MATCH_ID,
      poolId: pool.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].prediction).toBeNull();
  });

  it('should include the pool name in each entry', async () => {
    await createPool(poolsRepository, {
      name: 'Bolão da Família',
      tournamentId: TOURNAMENT_ID,
      creatorId: USER_ID,
    });
    poolsRepository.predictions = predictionsRepository.predictions;

    const { predictions } = await sut.execute({ matchId: MATCH_ID, userId: USER_ID });

    expect(predictions[0].poolName).toBe('Bolão da Família');
  });
});
