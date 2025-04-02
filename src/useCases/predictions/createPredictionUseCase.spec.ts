import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { MatchStage, MatchStatus } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePredictionUseCase } from './createPredictionUseCase';

describe('Create Prediction Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: CreatePredictionUseCase;

  beforeEach(() => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    matchesRepository = new InMemoryMatchesRepository();
    sut = new CreatePredictionUseCase(
      predictionsRepository,
      poolsRepository,
      usersRepository,
      matchesRepository
    );
  });

  it('should create a prediction successfully', async () => {
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

    // Create a match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create prediction
    const prediction = await sut.execute({
      userId: user.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    expect(prediction).toBeTruthy();
    expect(prediction.predictedHomeScore).toBe(2);
    expect(prediction.predictedAwayScore).toBe(1);
    expect(prediction.userId).toBe(user.id);
    expect(prediction.matchId).toBe(match.id);
    expect(prediction.poolId).toBe(pool.id);
  });

  it('should not allow prediction for a match that is not in SCHEDULED status', async () => {
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

    // Create a match that is already in progress
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.IN_PROGRESS, // Match is already in progress
    });

    // Attempt to create prediction for a match in progress
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('Predictions can only be made for upcoming matches');
  });

  it('should not allow duplicate predictions for the same match, user and pool', async () => {
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

    // Create a match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Create first prediction
    await sut.execute({
      userId: user.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    // Attempt to create a second prediction for the same match, user and pool
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    ).rejects.toThrow('Prediction already exists for this match in this pool');
  });

  it('should create a prediction with extra time and penalties', async () => {
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

    // Create prediction with extra time and penalties
    const prediction = await sut.execute({
      userId: user.id,
      matchId: match.id,
      poolId: pool.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedHasExtraTime: true,
      predictedHasPenalties: true,
      predictedPenaltyHomeScore: 5,
      predictedPenaltyAwayScore: 4,
    });

    expect(prediction).toBeTruthy();
    expect(prediction.predictedHomeScore).toBe(1);
    expect(prediction.predictedAwayScore).toBe(1);
    expect(prediction.predictedHasExtraTime).toBe(true);
    expect(prediction.predictedHasPenalties).toBe(true);
    expect(prediction.predictedPenaltyHomeScore).toBe(5);
    expect(prediction.predictedPenaltyAwayScore).toBe(4);
  });

  it('should not allow a user to create a prediction if they are not a participant in the pool', async () => {
    // Create two users
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    const anotherUser = await usersRepository.create({
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
      creator: { connect: { id: user.id } },
      isPrivate: true,
    });

    // Add only the first user as participant
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

    // Create a match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Attempt to create prediction with a user who is not a participant
    await expect(
      sut.execute({
        userId: anotherUser.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('User is not a participant in this pool');
  });

  it('should validate that penalty scores are provided when penalties are predicted', async () => {
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

    // Attempt to create prediction with penalties but without penalty scores
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        // Missing penalty scores
      })
    ).rejects.toThrow('Penalty scores must be provided when penalties are predicted');
  });

  it('should not allow predictions for matches that have already started', async () => {
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

    // Create a match that is scheduled but the match time is in the past
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago

    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: pastDate,
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.IN_PROGRESS,
    });

    // Attempt to create prediction for a match that has already started
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('Predictions can only be made for upcoming matches');
  });

  it('should validate that extra time can only be predicted for knockout stage matches', async () => {
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

    // Create a group stage match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Attempt to create prediction with extra time for a group stage match
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHasExtraTime: true, // Extra time not allowed for group stage
      })
    ).rejects.toThrow('Non knockout matches cannot have extra time or penalties');
  });

  it('should validate that penalties can only be predicted when scores are tied after extra time', async () => {
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

    // Attempt to create prediction with penalties but with different scores (not tied)
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1, // Not a tie
        predictedHasExtraTime: true,
        predictedHasPenalties: true,
        predictedPenaltyHomeScore: 5,
        predictedPenaltyAwayScore: 4,
      })
    ).rejects.toThrow('Penalties can only be predicted when scores are tied after extra time');
  });

  it('should not allow predictions for matches from tournaments not associated with the pool', async () => {
    // Create a user
    const user = await usersRepository.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'hashed-password',
    });

    // Create two tournaments
    const tournament1 = {
      id: 1,
      name: 'World Cup 2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    const tournament2 = {
      id: 2,
      name: 'Euro 2024',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    // Create a pool for tournament 1
    const pool = await poolsRepository.create({
      name: 'World Cup Pool',
      tournament: { connect: { id: tournament1.id } },
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
      name: 'Germany',
      countryCode: 'GER',
      createdAt: new Date(),
    };

    const awayTeam = {
      id: 2,
      name: 'France',
      countryCode: 'FRA',
      createdAt: new Date(),
    };

    // Create a match for tournament 2
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament2.id } }, // Different tournament
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2024-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Attempt to create prediction for a match from a different tournament
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('Match does not belong to the tournament associated with this pool');
  });

  it('should not allow negative scores in predictions', async () => {
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

    // Create a match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Attempt to create prediction with negative score
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: -1, // Negative score
        predictedAwayScore: 2,
      })
    ).rejects.toThrow('Predicted scores cannot be negative');
  });

  //TODO: implement this when tournaments repository gets implemented
  // it('should not allow predictions for tournaments with COMPLETED status', async () => {
  //   // Create a user
  //   const user = await usersRepository.create({
  //     fullName: 'John Doe',
  //     email: 'john@example.com',
  //     passwordHash: 'hashed-password',
  //   });

  //   // Create a tournament with COMPLETED status
  //   const tournament = {
  //     id: 1,
  //     name: 'World Cup 2022',
  //     startDate: new Date('2022-11-20'),
  //     endDate: new Date('2022-12-18'),
  //     status: 'COMPLETED', // Tournament is already completed
  //     createdAt: new Date(),
  //   };

  //   // Create a pool
  //   const pool = await poolsRepository.create({
  //     name: 'Test Pool',
  //     tournament: { connect: { id: tournament.id } },
  //     creator: { connect: { id: user.id } },
  //     isPrivate: false,
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

  //   // Create a match
  //   const match = await matchesRepository.create({
  //     tournament: { connect: { id: tournament.id } },
  //     homeTeam: { connect: { id: homeTeam.id } },
  //     awayTeam: { connect: { id: awayTeam.id } },
  //     matchDatetime: new Date('2022-12-18T15:00:00Z'),
  //     stage: MatchStage.FINAL,
  //     matchStatus: MatchStatus.SCHEDULED, // Match status is still SCHEDULED
  //   });

  //   // Attempt to create prediction for a completed tournament
  //   await expect(
  //     sut.execute({
  //       userId: user.id,
  //       matchId: match.id,
  //       poolId: pool.id,
  //       predictedHomeScore: 2,
  //       predictedAwayScore: 1,
  //     })
  //   ).rejects.toThrow('Cannot create predictions for completed tournaments');
  // });

  it('should throw an error when trying to create a prediction for a non-existent pool', async () => {
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

    // Create a match
    const match = await matchesRepository.create({
      tournament: { connect: { id: tournament.id } },
      homeTeam: { connect: { id: homeTeam.id } },
      awayTeam: { connect: { id: awayTeam.id } },
      matchDatetime: new Date('2026-06-15T15:00:00Z'),
      stage: MatchStage.GROUP,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Attempt to create prediction with a non-existent pool ID
    const nonExistentPoolId = 999; // This pool ID doesn't exist

    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: nonExistentPoolId,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('Pool not found');
  });

  it('should throw an error when trying to create a prediction for a non-existent match', async () => {
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

    // Attempt to create prediction with a non-existent match ID
    const nonExistentMatchId = 999; // This match ID doesn't exist

    await expect(
      sut.execute({
        userId: user.id,
        matchId: nonExistentMatchId,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toThrow('Match not found');
  });
});
