import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';
import { Match, MatchStage, MatchStatus, Pool, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePredictionUseCase } from './createPredictionUseCase';
import { InvalidScoreError } from './error/InvalidScoreError';
import { MatchStatusError } from './error/MatchStatusError';
import { NotParticipantError } from './error/NotParticipantError';
import { PredictionError } from './error/PredictionError';

describe('Create Prediction Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: CreatePredictionUseCase;

  let user: User;
  let pool: Pool;
  let match: Match;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();
    sut = new CreatePredictionUseCase(
      predictionsRepository,
      poolsRepository,
      usersRepository,
      matchesRepository
    );

    user = await createUser(usersRepository, {});
    pool = await createPool(poolsRepository, { creatorId: user.id });
    match = await createMatch(
      matchesRepository,
      { tournamentId: pool.tournamentId },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );
  });

  it('should create a prediction successfully', async () => {
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
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStatus: MatchStatus.IN_PROGRESS,
      }
    );

    // Attempt to create prediction for a match in progress
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toBeInstanceOf(MatchStatusError);
  });

  it('should not allow duplicate predictions for the same match, user and pool', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
      }
    );
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
    ).rejects.toBeInstanceOf(PredictionError);
  });

  it('should create a prediction with extra time and penalties', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStage: MatchStage.FINAL,
        matchStatus: MatchStatus.SCHEDULED,
      }
    );

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
    const anotherUser = await usersRepository.create({
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      passwordHash: 'hashed-password',
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
    ).rejects.toBeInstanceOf(NotParticipantError);
  });

  it('should validate that penalty scores are provided when penalties are predicted', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStage: MatchStage.FINAL,
        matchStatus: MatchStatus.SCHEDULED,
      }
    );
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
    ).rejects.toBeInstanceOf(PredictionError);
  });

  it('should not allow predictions for matches that have already started', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStatus: MatchStatus.IN_PROGRESS,
      }
    );

    // Attempt to create prediction for a match that has already started
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toBeInstanceOf(MatchStatusError);
  });

  it('should validate that extra time can only be predicted for knockout stage matches', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStatus: MatchStatus.SCHEDULED,
      }
    );

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
    ).rejects.toBeInstanceOf(PredictionError);
  });

  it('should validate that penalties can only be predicted when scores are tied after extra time', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: pool.tournamentId,
        matchStage: MatchStage.FINAL,
        matchStatus: MatchStatus.SCHEDULED,
      }
    );
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
    ).rejects.toBeInstanceOf(PredictionError);
  });

  it('should not allow predictions for matches from tournaments not associated with the pool', async () => {
    const tournament2 = {
      id: 2,
      name: 'Euro 2024',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-07-15'),
      status: 'UPCOMING',
      createdAt: new Date(),
    };

    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament2.id,
        matchStatus: MatchStatus.SCHEDULED,
      }
    );
    // Attempt to create prediction for a match from a different tournament
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow negative scores in predictions', async () => {
    // Attempt to create prediction with negative score
    await expect(
      sut.execute({
        userId: user.id,
        matchId: match.id,
        poolId: pool.id,
        predictedHomeScore: -1, // Negative score
        predictedAwayScore: 2,
      })
    ).rejects.toBeInstanceOf(InvalidScoreError);
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
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw an error when trying to create a prediction for a non-existent match', async () => {
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
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
