import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';
import { Match, Pool, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMatchPredictionsUseCase } from './getMatchPredictionsUseCase';

describe('Get Match Predictions Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let sut: GetMatchPredictionsUseCase;

  let aUser: User;
  let anotherUser: User;
  let aPool: Pool;
  let anotherPool: Pool;
  let aMatch: Match;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    matchesRepository = new InMemoryMatchesRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    teamsRepository = new InMemoryTeamsRepository();
    sut = new GetMatchPredictionsUseCase(predictionsRepository, matchesRepository);

    // Create users
    aUser = await createUser(usersRepository, {});
    anotherUser = await createUser(usersRepository, {
      email: 'another@example.com',
      fullName: 'Another User',
    });

    // Create pools
    aPool = await createPool(poolsRepository, { creatorId: aUser.id });
    anotherPool = await createPool(poolsRepository, {
      creatorId: aUser.id,
      name: 'Another Pool',
    });

    // Create match
    aMatch = await createMatch(
      matchesRepository,
      { tournamentId: aPool.tournamentId },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );
  });

  it('should return all predictions for a match', async () => {
    // Create predictions for the match
    await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    await predictionsRepository.create({
      pool: { connect: { id: anotherPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: anotherUser.id } },
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: aMatch.id });

    // Assertions
    expect(predictions).toHaveLength(3);
    expect(predictions[0].matchId).toBe(aMatch.id);
    expect(predictions[1].matchId).toBe(aMatch.id);
    expect(predictions[2].matchId).toBe(aMatch.id);
  });

  it('should return an empty array when no predictions exist for a match', async () => {
    // Create a match with no predictions
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: aPool.tournamentId }
    );

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: match.id });

    // Assertions
    expect(predictions).toHaveLength(0);
    expect(predictions).toEqual([]);
  });

  it('should throw an error when the match does not exist', async () => {
    // Attempt to get predictions for a non-existent match
    const nonExistentMatchId = 999;

    // Assertions
    await expect(sut.execute({ matchId: nonExistentMatchId })).rejects.toThrow('Match not found');
  });

  // it('should return predictions with correct user and pool information', async () => {
  //   // Create a prediction with specific user and pool
  //   await predictionsRepository.create({
  //     pool: { connect: { id: aPool.id } },
  //     match: { connect: { id: aMatch.id } },
  //     user: { connect: { id: aUser.id } },
  //     predictedHomeScore: 2,
  //     predictedAwayScore: 1,
  //   });

  //   // Mock the repository to include user and pool information
  //   // This is needed because InMemoryPredictionsRepository doesn't handle includes
  //   predictionsRepository.findByMatchId = async (matchId: number) => {
  //     const predictions = predictionsRepository.items.filter((item) => item.matchId === matchId);
  //     return predictions.map((prediction) => ({
  //       ...prediction,
  //       user: {
  //         id: prediction.userId,
  //         fullName: prediction.userId === aUser.id ? aUser.fullName : anotherUser.fullName,
  //         email: prediction.userId === aUser.id ? aUser.email : anotherUser.email,
  //         profileImageUrl: null,
  //       },
  //       pool: {
  //         id: prediction.poolId,
  //         name: prediction.poolId === aPool.id ? aPool.name : anotherPool.name,
  //       },
  //     })) as any;
  //   };

  //   // Get predictions for the match
  //   const predictions = await sut.execute({ matchId: aMatch.id });

  //   // Assertions
  //   expect(predictions).toHaveLength(1);
  //   expect(predictions[0].user).toBeDefined();
  //   expect(predictions[0].user.fullName).toBe(aUser.fullName);
  //   expect(predictions[0].pool).toBeDefined();
  //   expect(predictions[0].pool.name).toBe(aPool.name);
  // });

  it('should return predictions for a match with extra time and penalties', async () => {
    // Create a match in knockout stage
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStage: 'SEMI_FINAL',
      }
    );

    // Create prediction with extra time and penalties
    await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedHasExtraTime: true,
      predictedHasPenalties: true,
      predictedPenaltyHomeScore: 5,
      predictedPenaltyAwayScore: 4,
    });

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: match.id });

    // Assertions
    expect(predictions).toHaveLength(1);
    expect(predictions[0].predictedHasExtraTime).toBe(true);
    expect(predictions[0].predictedHasPenalties).toBe(true);
    expect(predictions[0].predictedPenaltyHomeScore).toBe(5);
    expect(predictions[0].predictedPenaltyAwayScore).toBe(4);
  });

  it('should return predictions from multiple pools for the same match', async () => {
    // Create a third pool
    const thirdPool = await createPool(poolsRepository, {
      creatorId: anotherUser.id,
      name: 'Third Pool',
    });

    // Create predictions for the same match in different pools
    await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    await predictionsRepository.create({
      pool: { connect: { id: anotherPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    await predictionsRepository.create({
      pool: { connect: { id: thirdPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: anotherUser.id } },
      predictedHomeScore: 1,
      predictedAwayScore: 2,
    });

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: aMatch.id });

    // Assertions
    expect(predictions).toHaveLength(3);

    // Check that predictions come from different pools
    const poolIds = predictions.map((p) => p.poolId);
    expect(poolIds).toContain(aPool.id);
    expect(poolIds).toContain(anotherPool.id);
    expect(poolIds).toContain(thirdPool.id);

    // Verify all predictions are for the same match
    const uniqueMatchIds = new Set(predictions.map((p) => p.matchId));
    expect(uniqueMatchIds.size).toBe(1);
    expect(uniqueMatchIds.has(aMatch.id)).toBe(true);
  });

  it('should handle a large number of predictions efficiently', async () => {
    // Create a large number of predictions (e.g., 100)
    for (let i = 0; i < 100; i++) {
      // Create a new user for each prediction to ensure uniqueness
      const user = await createUser(usersRepository, {
        email: `user${i}@example.com`,
        fullName: `User ${i}`,
      });

      // Create a new pool for each prediction to ensure uniqueness
      const pool = await createPool(poolsRepository, {
        creatorId: user.id,
        name: `Pool ${i}`,
      });

      // Create prediction
      await predictionsRepository.create({
        pool: { connect: { id: pool.id } },
        match: { connect: { id: aMatch.id } },
        user: { connect: { id: user.id } },
        predictedHomeScore: Math.floor(Math.random() * 5),
        predictedAwayScore: Math.floor(Math.random() * 5),
      });
    }

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: aMatch.id });

    // Assertions
    expect(predictions).toHaveLength(100);

    // Check that all predictions are for the correct match
    const allForCorrectMatch = predictions.every((p) => p.matchId === aMatch.id);
    expect(allForCorrectMatch).toBe(true);
  });

  it('should return predictions with updated scores', async () => {
    // Create a prediction
    const prediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Update the prediction (simulating an update)
    prediction.predictedHomeScore = 3;
    prediction.predictedAwayScore = 2;
    prediction.updatedAt = new Date();

    // Get predictions for the match
    const predictions = await sut.execute({ matchId: aMatch.id });

    // Assertions
    expect(predictions).toHaveLength(1);
    expect(predictions[0].predictedHomeScore).toBe(3);
    expect(predictions[0].predictedAwayScore).toBe(2);
    expect(predictions[0].updatedAt).toBeTruthy();
  });
});
