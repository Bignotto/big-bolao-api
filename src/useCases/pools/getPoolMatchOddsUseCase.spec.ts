import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchOddsRaw } from '@/global/types/matchOdds';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { createPool } from '@/test/mocks/pools';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';

import { GetPoolMatchOddsUseCase } from './getPoolMatchOddsUseCase';

function makeRaw(overrides: Partial<MatchOddsRaw> = {}): MatchOddsRaw {
  return {
    matchId: 1n,
    homeTeamId: 10n,
    homeTeamName: 'Brazil',
    homeTeamCountryCode: 'BRA',
    homeTeamFlagUrl: null,
    awayTeamId: 20n,
    awayTeamName: 'Argentina',
    awayTeamCountryCode: 'ARG',
    awayTeamFlagUrl: null,
    globalHomeWins: 0n,
    globalDraws: 0n,
    globalAwayWins: 0n,
    globalTotal: 0n,
    poolHomeWins: 0n,
    poolDraws: 0n,
    poolAwayWins: 0n,
    poolTotal: 0n,
    ...overrides,
  };
}

describe('GetPoolMatchOddsUseCase', () => {
  let poolsRepository: InMemoryPoolsRepository;
  let predictionsRepository: InMemoryPredictionsRepository;
  let sut: GetPoolMatchOddsUseCase;

  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    predictionsRepository = new InMemoryPredictionsRepository();
    const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new GetPoolMatchOddsUseCase(poolsRepository, predictionsRepository, poolAuthorizationService);
  });

  it('should throw ResourceNotFoundError when pool does not exist', async () => {
    await expect(sut.execute({ poolId: 999, userId: 'user-1' })).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  it('should throw NotParticipantError when user is not a pool member', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'creator-1', tournamentId: 1 });

    await expect(sut.execute({ poolId: pool.id, userId: 'outsider' })).rejects.toThrow(
      NotParticipantError
    );
  });

  it('should return empty odds array when repository returns no matches', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds).toEqual([]);
  });

  it('should compute correct home win percentages', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        globalHomeWins: 6n,
        globalDraws: 2n,
        globalAwayWins: 2n,
        globalTotal: 10n,
        poolHomeWins: 3n,
        poolDraws: 1n,
        poolAwayWins: 1n,
        poolTotal: 5n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global).toMatchObject({
      total: 10,
      homeWinsPercentage: 60,
      drawPercentage: 20,
      awayWinsPercentage: 20,
    });
    expect(odds[0].pool).toMatchObject({
      total: 5,
      homeWinsPercentage: 60,
      drawPercentage: 20,
      awayWinsPercentage: 20,
    });
  });

  it('should compute correct draw percentages', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        globalHomeWins: 2n,
        globalDraws: 6n,
        globalAwayWins: 2n,
        globalTotal: 10n,
        poolHomeWins: 0n,
        poolDraws: 4n,
        poolAwayWins: 0n,
        poolTotal: 4n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global.drawPercentage).toBe(60);
    expect(odds[0].pool.drawPercentage).toBe(100);
  });

  it('should compute correct away win percentages', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        globalHomeWins: 1n,
        globalDraws: 1n,
        globalAwayWins: 8n,
        globalTotal: 10n,
        poolHomeWins: 0n,
        poolDraws: 0n,
        poolAwayWins: 2n,
        poolTotal: 2n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global.awayWinsPercentage).toBe(80);
    expect(odds[0].pool.awayWinsPercentage).toBe(100);
  });

  it('should return zero percentages for a match with no predictions at all', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [makeRaw()];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global).toMatchObject({
      total: 0,
      homeWinsPercentage: 0,
      drawPercentage: 0,
      awayWinsPercentage: 0,
    });
    expect(odds[0].pool).toMatchObject({
      total: 0,
      homeWinsPercentage: 0,
      drawPercentage: 0,
      awayWinsPercentage: 0,
    });
  });

  it('should return zero pool percentages when pool has no predictions but global has some', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        globalHomeWins: 5n,
        globalDraws: 3n,
        globalAwayWins: 2n,
        globalTotal: 10n,
        poolHomeWins: 0n,
        poolDraws: 0n,
        poolAwayWins: 0n,
        poolTotal: 0n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global.total).toBe(10);
    expect(odds[0].global.homeWinsPercentage).toBe(50);
    expect(odds[0].pool.total).toBe(0);
    expect(odds[0].pool.homeWinsPercentage).toBe(0);
    expect(odds[0].pool.drawPercentage).toBe(0);
    expect(odds[0].pool.awayWinsPercentage).toBe(0);
  });

  it('should correctly map team information', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        matchId: 42n,
        homeTeamId: 10n,
        homeTeamName: 'Brazil',
        homeTeamCountryCode: 'BRA',
        homeTeamFlagUrl: 'https://example.com/bra.png',
        awayTeamId: 20n,
        awayTeamName: 'Argentina',
        awayTeamCountryCode: 'ARG',
        awayTeamFlagUrl: null,
        globalTotal: 1n,
        globalHomeWins: 1n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0]).toMatchObject({
      matchId: 42,
      homeTeam: { id: 10, name: 'Brazil', countryCode: 'BRA', flagUrl: 'https://example.com/bra.png' },
      awayTeam: { id: 20, name: 'Argentina', countryCode: 'ARG', flagUrl: null },
    });
  });

  it('should round percentages to 2 decimal places', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    // 1/3 each → 33.33%
    predictionsRepository.getMatchOdds = async () => [
      makeRaw({
        globalHomeWins: 1n,
        globalDraws: 1n,
        globalAwayWins: 1n,
        globalTotal: 3n,
        poolTotal: 0n,
      }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds[0].global.homeWinsPercentage).toBe(33.33);
    expect(odds[0].global.drawPercentage).toBe(33.33);
    expect(odds[0].global.awayWinsPercentage).toBe(33.33);
  });

  it('should handle multiple matches and return one entry per match', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOdds = async () => [
      makeRaw({ matchId: 1n, globalTotal: 10n, globalHomeWins: 10n, globalDraws: 0n, globalAwayWins: 0n }),
      makeRaw({ matchId: 2n, globalTotal: 10n, globalHomeWins: 0n, globalDraws: 10n, globalAwayWins: 0n }),
      makeRaw({ matchId: 3n, globalTotal: 10n, globalHomeWins: 0n, globalDraws: 0n, globalAwayWins: 10n }),
    ];

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'user-1' });

    expect(odds).toHaveLength(3);
    expect(odds[0].global.homeWinsPercentage).toBe(100);
    expect(odds[1].global.drawPercentage).toBe(100);
    expect(odds[2].global.awayWinsPercentage).toBe(100);
  });

  it('should allow pool creator to access odds', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'creator-user', tournamentId: 1 });

    const { odds } = await sut.execute({ poolId: pool.id, userId: 'creator-user' });

    expect(Array.isArray(odds)).toBe(true);
  });
});
