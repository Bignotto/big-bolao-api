import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createMatchWithTeams } from '@/test/mocks/match';
import { createPool, createPoolWithParticipants } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';
import { Pool, Prediction, Tournament, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPoolPredictionsUseCase } from './getPoolsPredictionsUseCase';

describe('Get Pool Predictions Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: GetPoolPredictionsUseCase;

  let tournament: Tournament;
  let poolWithParticipants: { pool: Pool; participants: User[] };
  let predictions: Prediction[] = [];
  let nonParticipantUser: User;

  beforeEach(async () => {
    predictions = [];
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();

    sut = new GetPoolPredictionsUseCase(predictionsRepository, poolsRepository);

    // Create tournament
    tournament = await createTournament(tournamentsRepository, {
      name: 'World Cup 2026',
    });

    // Create pool with participants
    poolWithParticipants = await createPoolWithParticipants(
      {
        poolsRepository,
        usersRepository,
      },
      {
        name: 'Test Pool',
        tournamentId: tournament.id,
      }
    );

    // Create a non-participant user
    nonParticipantUser = await createUser(usersRepository, {
      fullName: 'Non Participant',
      email: 'nonparticipant@example.com',
    });

    // Create matches
    const matchData = await createMatchWithTeams(
      {
        matchesRepository,
        teamsRepository,
      },
      {
        tournamentId: tournament.id,
      }
    );

    const match2Data = await createMatchWithTeams(
      {
        matchesRepository,
        teamsRepository,
      },
      {
        tournamentId: tournament.id,
      }
    );

    // Create predictions for the pool
    // Prediction from first participant (creator)
    predictions.push(
      await createPrediction(predictionsRepository, {
        userId: poolWithParticipants.participants[0].id,
        matchId: matchData.match.id,
        poolId: poolWithParticipants.pool.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })
    );

    // Prediction from second participant
    predictions.push(
      await createPrediction(predictionsRepository, {
        userId: poolWithParticipants.participants[1].id,
        matchId: matchData.match.id,
        poolId: poolWithParticipants.pool.id,
        predictedHomeScore: 1,
        predictedAwayScore: 2,
      })
    );

    // Another prediction from first participant for a different match
    predictions.push(
      await createPrediction(predictionsRepository, {
        userId: poolWithParticipants.participants[0].id,
        matchId: match2Data.match.id,
        poolId: poolWithParticipants.pool.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })
    );

    // Create a prediction for a different pool
    const anotherPool = await createPool(poolsRepository, {
      name: 'Another Pool',
      tournamentId: tournament.id,
      creatorId: nonParticipantUser.id,
    });

    await createPrediction(predictionsRepository, {
      userId: nonParticipantUser.id,
      matchId: matchData.match.id,
      poolId: anotherPool.id,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
    });
  });

  it('should be able to get all predictions for a pool as a participant', async () => {
    const result = await sut.execute({
      poolId: poolWithParticipants.pool.id,
      userId: poolWithParticipants.participants[1].id, // Second participant
    });

    expect(result.predictions).toHaveLength(3);
    expect(result.predictions).toEqual(expect.arrayContaining(predictions));
  });

  it('should be able to get all predictions for a pool as the creator', async () => {
    const result = await sut.execute({
      poolId: poolWithParticipants.pool.id,
      userId: poolWithParticipants.participants[0].id, // Creator
    });

    expect(result.predictions).toHaveLength(3);
    expect(result.predictions).toEqual(expect.arrayContaining(predictions));
  });

  it('should not return predictions from other pools', async () => {
    const result = await sut.execute({
      poolId: poolWithParticipants.pool.id,
      userId: poolWithParticipants.participants[0].id,
    });

    // All returned predictions should be for the requested pool
    result.predictions.forEach((prediction) => {
      expect(prediction.poolId).toBe(poolWithParticipants.pool.id);
    });

    // Should have exactly 3 predictions (the ones we created for this pool)
    expect(result.predictions).toHaveLength(3);
  });

  it('should not allow a non-participant to get pool predictions', async () => {
    await expect(() =>
      sut.execute({
        poolId: poolWithParticipants.pool.id,
        userId: nonParticipantUser.id,
      })
    ).rejects.toThrow('You must be a participant in this pool to view predictions');
  });

  it('should throw an error if pool does not exist', async () => {
    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: poolWithParticipants.participants[0].id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
