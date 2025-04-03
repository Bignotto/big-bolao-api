import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { MatchStage, MatchStatus } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePredictionUseCase } from './updatePredictionUseCase';

describe('Update Prediction Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: UpdatePredictionUseCase;

  beforeEach(() => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    matchesRepository = new InMemoryMatchesRepository();
    sut = new UpdatePredictionUseCase(
      predictionsRepository,
      poolsRepository,
      usersRepository,
      matchesRepository
    );
  });

  it('should update a prediction successfully', async () => {
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a match with future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: futureDate,
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Update prediction
    const updatedPrediction = await sut.execute({
      predictionId: initialPrediction.id,
      userId: user.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    expect(updatedPrediction).toBeTruthy();
    expect(updatedPrediction.predictedHomeScore).toBe(3);
    expect(updatedPrediction.predictedAwayScore).toBe(0);
    expect(updatedPrediction.userId).toBe(user.id);
    expect(updatedPrediction.matchId).toBe(match.id);
    expect(updatedPrediction.poolId).toBe(pool.id);
    expect(updatedPrediction.updatedAt).toBeTruthy();
  });

  it("should not allow updating another user's prediction", async () => {
    // Create two users
    const user1 = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    const user2 = await usersRepository.create({
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user1.id } },
      isPrivate: false,
    });

    // Add both users as participants
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user1.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user2.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a match with future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: futureDate,
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create prediction for user1
    const user1Prediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user1.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update user1's prediction as user2
    await expect(
      sut.execute({
        predictionId: user1Prediction.id,
        userId: user2.id, // Different user
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('You can only update your own predictions');
  });

  it('should not allow updating a prediction for a match that has already started', async () => {
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a match with a past date (already started)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: pastDate,
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.IN_PROGRESS, // Still scheduled in system but time has passed
    });

    // Create initial prediction (this would normally be created before the match started)
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update prediction for a match that has already started
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: user.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('Predictions can only be updated for upcoming matches');
  });

  it('should update a prediction with extra time and penalties for knockout stage matches', async () => {
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a knockout stage match with future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: futureDate,
      stage: MatchStage.QUARTER_FINAL, // Knockout stage
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Update prediction with extra time and penalties
    const updatedPrediction = await sut.execute({
      predictionId: initialPrediction.id,
      userId: user.id,
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
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a knockout stage match with future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: futureDate,
      stage: MatchStage.SEMI_FINAL, // Knockout stage
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create initial prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to update prediction with penalties but scores are not tied
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: user.id,
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
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a knockout stage match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-07-10T15:00:00Z'),
      stage: MatchStage.QUARTER_FINAL,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // First create a valid prediction
    const initialPrediction = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    // Attempt to update prediction with hasPenalties=true but without penalty scores
    await expect(
      sut.execute({
        predictionId: initialPrediction.id,
        userId: user.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        // Missing penalty scores
      })
    ).rejects.toThrow('Penalty scores must be provided when penalties are predicted');
  });

  it('should validate that extra time and penalties can only be true if scores are tied during update', async () => {
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create a tournament
    const tournament = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Add user as participant
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: user.id,
    });

    // Create teams
    const homeTeam = {
      id: 1,
      name: 'Brazil',
      countryCode: 'BRA',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'Argentina',
      countryCode: 'ARG',
      createdAt: new Date(),
    };

    // Create a knockout stage match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-07-10T15:00:00Z'),
      stage: MatchStage.SEMI_FINAL,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create initial predictions for each test case
    const prediction1 = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    const prediction2 = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    const prediction3 = await predictionsRepository.create({
      pool: { connect: { id: pool.id } },
      match: { connect: { id: match.id } },
      user: { connect: { id: user.id } },
      predictedHomeScore: 0,
      predictedAwayScore: 0,
      predictedHasExtraTime: false,
      predictedHasPenalties: false,
    });

    // Test case 1: Attempt to update prediction with extraTime=true but scores are not tied
    await expect(
      sut.execute({
        predictionId: prediction1.id,
        userId: user.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1, // Not tied
        predictedHasExtraTime: true,
      })
    ).rejects.toThrow('Extra time can only be predicted when scores are tied');

    // Test case 2: Attempt to update prediction with penalties=true but scores are not tied
    await expect(
      sut.execute({
        predictionId: prediction2.id,
        userId: user.id,
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
      userId: user.id,
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

  // it('should not allow updating a prediction after the registration deadline', async () => {
  //   // Create a user
  //   const user = await usersRepository.create({
  //     fullName: 'John Doe',
  //     email: 'john@example.com',
  //     passwordHash: 'hashed-password',
  //   });

  //   // Create a tournament
  //   const tournament = {
  //     id: 1,
  //     name: 'World Cup 2026',
  //     startDate: new Date('2026-06-01'),
  //     endDate: new Date('2026-07-15'),
  //     status: 'UPCOMING',
  //     createdAt: new Date(),
  //   };

  //   // Set registration deadline to yesterday
  //   const yesterday = new Date();
  //   yesterday.setDate(yesterday.getDate() - 1);

  //   // Create a pool with a past registration deadline
  //   const pool = await poolsRepository.create({
  //     name: 'Test Pool',
  //     tournament: { connect: { id: tournament.id } },
  //     creator: { connect: { id: user.id } },
  //     isPrivate: false,
  //     registrationDeadline: yesterday,
  //   });

  //   // Add user as participant
  //   await poolsRepository.addParticipant({
  //     poolId: pool.id,
  //     userId: user.id,
  //   });

  //   // Create teams
  //   const homeTeam = {
  //     id: 1,
  //     name: 'Brazil',
  //     countryCode: 'BRA',
  //     createdAt: new Date(),
  //   };

  //   const awayTeam = {
  //     id: 2,
  //     name: 'Argentina',
  //     countryCode: 'ARG',
  //     createdAt: new Date(),
  //   };

  //   // Create a match with future date
  //   const futureDate = new Date();
  //   futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

  //   const match = await matchesRepository.create({
  //     tournament: { connect: { id: tournament.id } },
  //     homeTeam: { connect: { id: homeTeam.id } },
  //     awayTeam: { connect: { id: awayTeam.id } },
  //     matchDatetime: futureDate,
  //     stage: 'Group Stage',
  //     matchStatus: MatchStatus.SCHEDULED,
  //   });

  //   // Create initial prediction
  //   const initialPrediction = await predictionsRepository.create({
  //     poolId: pool.id,
  //     matchId: match.id,
  //     userId: user.id,
  //     predictedHomeScore: 2,
  //     predictedAwayScore: 1,
  //   });

  //   // Attempt to update prediction after registration deadline
  //   await expect(
  //     sut.execute({
  //       predictionId: initialPrediction.id,
  //       userId: user.id,
  //       predictedHomeScore: 3,
  //       predictedAwayScore: 0,
  //     })
  //   ).rejects.toThrow('Registration deadline for this pool has passed');
  // });
});
