import { Match, Pool, Prediction, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotParticipantError } from '@/global/errors/NotParticipantError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createMatch } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';

import { GetUserPredictionsUseCase } from './getUserPredictionsUseCase';

describe('Get User Predictions Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let usersRepository: InMemoryUsersRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: GetUserPredictionsUseCase;

  let user1: User;
  let user2: User;
  let user3: User;
  let pool1: Pool;
  let pool2: Pool;
  let match1: Match;
  let match2: Match;
  let prediction1: Prediction;
  let prediction2: Prediction;
  let prediction3: Prediction;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    usersRepository = new InMemoryUsersRepository();
    poolsRepository = new InMemoryPoolsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();

    sut = new GetUserPredictionsUseCase(predictionsRepository, usersRepository, poolsRepository);

    // Create test users
    user1 = await createUser(usersRepository, { fullName: 'User One' });
    user2 = await createUser(usersRepository, { fullName: 'User Two' });
    user3 = await createUser(usersRepository, { fullName: 'User Three' });

    // Create test pools
    pool1 = await createPool(poolsRepository, { creatorId: user1.id, name: 'Pool One' });
    pool2 = await createPool(poolsRepository, { creatorId: user1.id, name: 'Pool Two' });

    // Add user2 as participant to pool1
    await poolsRepository.addParticipant({ poolId: pool1.id, userId: user2.id });

    // Create test matches
    match1 = await createMatch(
      matchesRepository,
      { tournamentId: pool1.tournamentId },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );

    match2 = await createMatch(
      matchesRepository,
      { tournamentId: pool1.tournamentId },
      await createTeam(teamsRepository, { name: 'France', countryCode: 'FRA' }),
      await createTeam(teamsRepository, { name: 'Germany', countryCode: 'GER' })
    );

    // Create test predictions
    prediction1 = await createPrediction(predictionsRepository, {
      userId: user1.id,
      matchId: match1.id,
      poolId: pool1.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    prediction2 = await createPrediction(predictionsRepository, {
      userId: user1.id,
      matchId: match2.id,
      poolId: pool1.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    prediction3 = await createPrediction(predictionsRepository, {
      userId: user1.id,
      matchId: match1.id,
      poolId: pool2.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    // Create a prediction for user2
    await createPrediction(predictionsRepository, {
      userId: user2.id,
      matchId: match1.id,
      poolId: pool1.id,
      predictedHomeScore: 0,
      predictedAwayScore: 2,
    });
  });

  it('should be able to get all predictions for a user', async () => {
    const result = await sut.execute({
      userId: user1.id,
    });

    expect(result.predictions).toHaveLength(3);
    expect(result.predictions).toEqual(
      expect.arrayContaining([prediction1, prediction2, prediction3])
    );
  });

  it('should be able to get predictions for a user filtered by pool', async () => {
    const result = await sut.execute({
      userId: user1.id,
      poolId: pool1.id,
    });

    expect(result.predictions).toHaveLength(2);
    expect(result.predictions).toEqual(expect.arrayContaining([prediction1, prediction2]));
  });

  it('should be able to get predictions for a participant user filtered by pool', async () => {
    const result = await sut.execute({
      userId: user2.id,
      poolId: pool1.id,
    });

    expect(result.predictions).toHaveLength(1);
    expect(result.predictions[0].userId).toBe(user2.id);
    expect(result.predictions[0].poolId).toBe(pool1.id);
  });

  it('should return empty array when user has no predictions', async () => {
    const newUser = await createUser(usersRepository, { fullName: 'New User' });

    const result = await sut.execute({
      userId: newUser.id,
    });

    expect(result.predictions).toHaveLength(0);
    expect(result.predictions).toEqual([]);
  });

  it('should not return predictions from other users', async () => {
    const result = await sut.execute({
      userId: user1.id,
    });

    // Make sure we don't get user2's prediction
    const hasUser2Predictions = result.predictions.some(
      (prediction) => prediction.userId === user2.id
    );

    expect(hasUser2Predictions).toBe(false);
  });

  it('should throw an error if user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent-user',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw an error if pool does not exist when poolId is provided', async () => {
    await expect(() =>
      sut.execute({
        userId: user1.id,
        poolId: 999,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw an error if user is not a participant or creator of the pool', async () => {
    await expect(() =>
      sut.execute({
        userId: user3.id,
        poolId: pool1.id,
      })
    ).rejects.toBeInstanceOf(NotParticipantError);
  });

  it('should allow pool creator to get predictions even if not explicitly a participant', async () => {
    const result = await sut.execute({
      userId: user1.id,
      poolId: pool1.id,
    });

    expect(result.predictions).toHaveLength(2);
    expect(result.predictions).toEqual(expect.arrayContaining([prediction1, prediction2]));
  });
});
