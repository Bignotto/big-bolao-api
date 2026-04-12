import { Match, Pool, Prediction, Tournament, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { createMatchWithTeams } from '@/test/mocks/match';
import { createPool, createPoolWithParticipants } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

import { NotParticipantError } from './errors/NotParticipantError';
import { GetPoolMatchPredictionsUseCase } from './getPoolMatchPredictionsUseCase';

describe('Get Pool Match Predictions Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let sut: GetPoolMatchPredictionsUseCase;

  let tournament: Tournament;
  let pool: Pool;
  let creator: User;
  let participant: User;
  let participantWithoutPrediction: User;
  let nonParticipant: User;
  let scheduledMatch: Match;
  let completedMatch: Match;
  let creatorPrediction: Prediction;
  let participantPrediction: Prediction;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();

    sut = new GetPoolMatchPredictionsUseCase(
      predictionsRepository,
      poolsRepository,
      matchesRepository,
      new PoolAuthorizationService(poolsRepository)
    );

    tournament = await createTournament(tournamentsRepository, { name: 'World Cup 2026' });

    const poolWithParticipants = await createPoolWithParticipants(
      { poolsRepository, usersRepository },
      { tournamentId: tournament.id, name: 'Main Pool' }
    );

    pool = poolWithParticipants.pool;
    creator = poolWithParticipants.participants[0];
    participant = poolWithParticipants.participants[1];
    participantWithoutPrediction = await createUser(usersRepository, {
      fullName: 'No Prediction',
      email: 'no-prediction@example.com',
    });
    nonParticipant = await createUser(usersRepository, {
      fullName: 'Outside User',
      email: 'outside-user@example.com',
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participantWithoutPrediction.id,
    });

    ({ match: scheduledMatch } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id, matchStatus: 'SCHEDULED' }
    ));
    ({ match: completedMatch } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id, matchStatus: 'COMPLETED' }
    ));

    creatorPrediction = await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: scheduledMatch.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
    participantPrediction = await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: scheduledMatch.id,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    });

    await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: completedMatch.id,
      predictedHomeScore: 3,
      predictedAwayScore: 2,
    });

    const anotherPool = await createPool(poolsRepository, {
      tournamentId: tournament.id,
      creatorId: nonParticipant.id,
      name: 'Another Pool',
    });
    await createPrediction(predictionsRepository, {
      userId: nonParticipant.id,
      poolId: anotherPool.id,
      matchId: scheduledMatch.id,
      predictedHomeScore: 4,
      predictedAwayScore: 4,
    });
  });

  it('should return one row per participant for a scheduled match', async () => {
    const result = await sut.execute({
      poolId: pool.id,
      matchId: scheduledMatch.id,
      userId: creator.id,
    });

    expect(result.predictions).toHaveLength(3);
    expect(result.predictions.map((row) => row.participant.id)).toEqual(
      expect.arrayContaining([creator.id, participant.id, participantWithoutPrediction.id])
    );
  });

  it('should show only the requester prediction details for a scheduled match', async () => {
    const result = await sut.execute({
      poolId: pool.id,
      matchId: scheduledMatch.id,
      userId: creator.id,
    });

    const creatorRow = result.predictions.find((row) => row.participant.id === creator.id);
    const participantRow = result.predictions.find((row) => row.participant.id === participant.id);
    const noPredictionRow = result.predictions.find(
      (row) => row.participant.id === participantWithoutPrediction.id
    );

    expect(creatorRow?.predictionSubmitted).toBe(true);
    expect(creatorRow?.prediction).toEqual(creatorPrediction);
    expect(participantRow?.predictionSubmitted).toBe(true);
    expect(participantRow?.prediction).toBeNull();
    expect(noPredictionRow?.predictionSubmitted).toBe(false);
    expect(noPredictionRow?.prediction).toBeNull();
  });

  it('should show all prediction details for a non-scheduled match', async () => {
    const result = await sut.execute({
      poolId: pool.id,
      matchId: completedMatch.id,
      userId: creator.id,
    });

    const participantRow = result.predictions.find((row) => row.participant.id === participant.id);

    expect(participantRow?.predictionSubmitted).toBe(true);
    expect(participantRow?.prediction).toEqual(
      expect.objectContaining({
        userId: participant.id,
        poolId: pool.id,
        matchId: completedMatch.id,
      })
    );
  });

  it('should filter predictions by pool and match', async () => {
    const result = await sut.execute({
      poolId: pool.id,
      matchId: scheduledMatch.id,
      userId: creator.id,
    });

    const submittedRows = result.predictions.filter((row) => row.predictionSubmitted);

    expect(submittedRows).toHaveLength(2);
    expect(submittedRows.map((row) => row.participant.id)).toEqual(
      expect.arrayContaining([creator.id, participant.id])
    );
  });

  it('should allow a pool participant to access the rows', async () => {
    const result = await sut.execute({
      poolId: pool.id,
      matchId: scheduledMatch.id,
      userId: participant.id,
    });

    const participantRow = result.predictions.find((row) => row.participant.id === participant.id);

    expect(participantRow?.prediction).toEqual(participantPrediction);
  });

  it('should reject non-participants', async () => {
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        matchId: scheduledMatch.id,
        userId: nonParticipant.id,
      })
    ).rejects.toThrow(NotParticipantError);
  });

  it('should throw when pool does not exist', async () => {
    await expect(() =>
      sut.execute({ poolId: 999, matchId: scheduledMatch.id, userId: creator.id })
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when match does not exist', async () => {
    await expect(() =>
      sut.execute({ poolId: pool.id, matchId: 999, userId: creator.id })
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when match is outside the pool tournament', async () => {
    const anotherTournament = await createTournament(tournamentsRepository, {
      name: 'Another Tournament',
    });
    const { match } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: anotherTournament.id, matchStatus: 'COMPLETED' }
    );

    await expect(() =>
      sut.execute({ poolId: pool.id, matchId: match.id, userId: creator.id })
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
