import { Match, MatchStage, MatchStatus, Pool, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';

import { UpdatePredictionUseCase } from './updatePredictionUseCase';

describe('Update Prediction Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let teamsRepository: InMemoryTeamsRepository;

  let matchesRepository: InMemoryMatchesRepository;
  let sut: UpdatePredictionUseCase;

  let aUser: User;
  let aPool: Pool;
  let aMatch: Match;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    matchesRepository = new InMemoryMatchesRepository();
    teamsRepository = new InMemoryTeamsRepository();
    sut = new UpdatePredictionUseCase(
      predictionsRepository,
      poolsRepository,
      usersRepository,
      matchesRepository
    );

    aUser = await createUser(usersRepository, {});
    aPool = await createPool(poolsRepository, { creatorId: aUser.id });
    aMatch = await createMatch(
      matchesRepository,
      { tournamentId: aPool.tournamentId },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );
  });

  it('should update a prediction successfully', async () => {
    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Update prediction
    const updatedPrediction = await sut.execute({
      predictionId: initialPrediction.id,
      userId: aUser.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    expect(updatedPrediction).toBeTruthy();
    expect(updatedPrediction.predictedHomeScore).toBe(3);
    expect(updatedPrediction.predictedAwayScore).toBe(0);
    expect(updatedPrediction.userId).toBe(aUser.id);
    expect(updatedPrediction.matchId).toBe(aMatch.id);
    expect(updatedPrediction.poolId).toBe(aPool.id);
    expect(updatedPrediction.updatedAt).toBeTruthy();
  });

  it("should not allow updating another user's prediction", async () => {
    // Create two users
    const user1 = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create prediction for user1
    const user1Prediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update user1's prediction as user2
    await expect(
      sut.execute({
        predictionId: user1Prediction.id,
        userId: user1.id, // Different user
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('You can only update your own predictions');
  });

  it('should not allow updating a prediction for a match that has already started', async () => {
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStatus: MatchStatus.IN_PROGRESS,
      }
    );

    // Create initial prediction (this would normally be created before the match started)
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update prediction for a match that has already started
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: aUser.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('Predictions can only be updated for upcoming matches');
  });

  it('should not allow updating a prediction if match is not part of the pool tournament', async () => {
    const anotherPool = await createPool(poolsRepository, {
      creatorId: aUser.id,
      tournamentId: aPool.tournamentId + 1,
    });

    const prediction = await predictionsRepository.create({
      pool: { connect: { id: anotherPool.id } },
      match: { connect: { id: aMatch.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    });

    await expect(
      sut.execute({
        predictionId: prediction.id,
        userId: aUser.id,
        predictedHomeScore: 0,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('Match not found in the pool');
  });

  it('should update a prediction with extra time and penalties for knockout stage matches', async () => {
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStage: MatchStage.QUARTER_FINAL,
      }
    );
    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Update prediction with extra time and penalties
    const updatedPrediction = await sut.execute({
      predictionId: initialPrediction.id,
      userId: aUser.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedHasExtraTime: true,
      predictedHasPenalties: true,
      predictedPenaltyHomeScore: 5,
      predictedPenaltyAwayScore: 4,
    });

    expect(updatedPrediction).toBeTruthy();
    expect(updatedPrediction.predictedHomeScore).toBe(1);
    expect(updatedPrediction.predictedAwayScore).toBe(1);
    expect(updatedPrediction.predictedHasExtraTime).toBe(true);
    expect(updatedPrediction.predictedHasPenalties).toBe(true);
    expect(updatedPrediction.predictedPenaltyHomeScore).toBe(5);
    expect(updatedPrediction.predictedPenaltyAwayScore).toBe(4);
  });

  it('should not allow updating a prediction with penalties if scores are not tied', async () => {
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStage: MatchStage.QUARTER_FINAL,
      }
    );

    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update prediction with penalties but scores are not tied
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: aUser.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1, // Not tied
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 5,
        predictedPenaltyAwayScore: 4,
      })
    ).rejects.toThrow('Extra time can only be predicted when scores are tied');
  });

  it('should validate that penalty scores must be provided when hasPenalties is true during update', async () => {
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStage: MatchStage.QUARTER_FINAL,
      }
    );
    // First create a valid prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    // Attempt to update prediction with hasPenalties=true but without penalty scores
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: aUser.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        // Missing penalty scores
      })
    ).rejects.toThrow('Penalty scores must be provided when penalties are predicted');
  });

  it('should validate that extra time and penalties can only be true if scores are tied during update', async () => {
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: aPool.tournamentId,
        matchStage: MatchStage.SEMI_FINAL,
      }
    );

    // Create initial predictions for each test case
    const prediction1 = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    const prediction2 = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    const prediction3 = await predictionsRepository.create({
      pool: { connect: { id: aPool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: aUser.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    // Test case 1: Attempt to update prediction with extraTime=true but scores are not tied
    await expect(
      sut.execute({
        predictionId: prediction1.id,
        userId: aUser.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1, // Not tied
        predictedHasExtraTime: true,
      })
    ).rejects.toThrow('Extra time can only be predicted when scores are tied');

    // Test case 2: Attempt to update prediction with penalties=true but scores are not tied
    await expect(
      sut.execute({
        predictionId: prediction2.id,
        userId: aUser.id,
        predictedHomeScore: 3,
        predictedAwayScore: 2, // Not tied
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 5,
        predictedPenaltyAwayScore: 4,
      })
    ).rejects.toThrow('Extra time can only be predicted when scores are tied');

    // Test case 3: Successful prediction update with tied scores, extra time and penalties
    const updatedPrediction = await sut.execute({
      predictionId: prediction3.id,
      userId: aUser.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1, // Tied
      predictedHasExtraTime: true,
      predictedHasPenalties: true,
      predictedPenaltyHomeScore: 5,
      predictedPenaltyAwayScore: 4,
    });

    expect(updatedPrediction).toBeTruthy();
    expect(updatedPrediction.predictedHomeScore).toBe(1);
    expect(updatedPrediction.predictedAwayScore).toBe(1);
    expect(updatedPrediction.predictedHasExtraTime).toBe(true);
    expect(updatedPrediction.predictedHasPenalties).toBe(true);
    expect(updatedPrediction.predictedPenaltyHomeScore).toBe(5);
    expect(updatedPrediction.predictedPenaltyAwayScore).toBe(4);
  });
});
