import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchOddsRaw } from '@/global/types/matchOdds';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { createPool } from '@/test/mocks/pools';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';

import { GetPoolMatchOddsByMatchUseCase } from './getPoolMatchOddsByMatchUseCase';

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

describe('GetPoolMatchOddsByMatchUseCase', () => {
  let poolsRepository: InMemoryPoolsRepository;
  let predictionsRepository: InMemoryPredictionsRepository;
  let sut: GetPoolMatchOddsByMatchUseCase;

  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    predictionsRepository = new InMemoryPredictionsRepository();
    const poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new GetPoolMatchOddsByMatchUseCase(
      poolsRepository,
      predictionsRepository,
      poolAuthorizationService
    );
  });

  it('should throw ResourceNotFoundError when pool does not exist', async () => {
    await expect(sut.execute({ poolId: 999, matchId: 1, userId: 'user-1' })).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  it('should throw NotParticipantError when user is not a pool member', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'creator-1', tournamentId: 1 });

    await expect(
      sut.execute({ poolId: pool.id, matchId: 1, userId: 'outsider' })
    ).rejects.toThrow(NotParticipantError);
  });

  it('should throw ResourceNotFoundError when match does not exist in the tournament', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });
    // stub returns null (default) → match not found

    await expect(
      sut.execute({ poolId: pool.id, matchId: 9999, userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return a single MatchOdds object for a valid match', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOddsByMatchId = () => Promise.resolve(
      makeRaw({
        matchId: 5n,
        globalHomeWins: 4n,
        globalDraws: 3n,
        globalAwayWins: 3n,
        globalTotal: 10n,
        poolHomeWins: 2n,
        poolDraws: 1n,
        poolAwayWins: 2n,
        poolTotal: 5n,
      })
    );

    const { odds } = await sut.execute({ poolId: pool.id, matchId: 5, userId: 'user-1' });

    expect(odds.matchId).toBe(5);
    expect(odds.global).toMatchObject({
      total: 10,
      homeWinsPercentage: 40,
      drawPercentage: 30,
      awayWinsPercentage: 30,
    });
    expect(odds.pool).toMatchObject({
      total: 5,
      homeWinsPercentage: 40,
      drawPercentage: 20,
      awayWinsPercentage: 40,
    });
  });

  it('should return zero percentages for a match with no predictions', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOddsByMatchId = () => Promise.resolve(makeRaw());

    const { odds } = await sut.execute({ poolId: pool.id, matchId: 1, userId: 'user-1' });

    expect(odds.global.total).toBe(0);
    expect(odds.global.homeWinsPercentage).toBe(0);
    expect(odds.pool.total).toBe(0);
  });

  it('should return zero pool percentages when pool has no predictions but global has some', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOddsByMatchId = () => Promise.resolve(
      makeRaw({
        globalHomeWins: 7n,
        globalDraws: 2n,
        globalAwayWins: 1n,
        globalTotal: 10n,
        poolTotal: 0n,
      })
    );

    const { odds } = await sut.execute({ poolId: pool.id, matchId: 1, userId: 'user-1' });

    expect(odds.global.total).toBe(10);
    expect(odds.global.homeWinsPercentage).toBe(70);
    expect(odds.pool.total).toBe(0);
    expect(odds.pool.homeWinsPercentage).toBe(0);
  });

  it('should correctly map team information', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'user-1', tournamentId: 1 });

    predictionsRepository.getMatchOddsByMatchId = () => Promise.resolve(
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
      })
    );

    const { odds } = await sut.execute({ poolId: pool.id, matchId: 42, userId: 'user-1' });

    expect(odds.homeTeam).toMatchObject({ id: 10, name: 'Brazil', countryCode: 'BRA' });
    expect(odds.awayTeam).toMatchObject({ id: 20, name: 'Argentina', countryCode: 'ARG', flagUrl: null });
  });

  it('should allow pool creator to access match odds', async () => {
    const pool = await createPool(poolsRepository, { creatorId: 'creator-user', tournamentId: 1 });

    predictionsRepository.getMatchOddsByMatchId = () => Promise.resolve(makeRaw());

    const { odds } = await sut.execute({ poolId: pool.id, matchId: 1, userId: 'creator-user' });

    expect(odds).toHaveProperty('matchId');
    expect(odds).toHaveProperty('global');
    expect(odds).toHaveProperty('pool');
  });
});
