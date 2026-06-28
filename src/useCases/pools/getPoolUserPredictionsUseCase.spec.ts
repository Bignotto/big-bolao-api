import { MatchStatus, Pool, Tournament, User } from '@prisma/client';
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
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTournament } from '@/test/mocks/tournament';
import { createUser } from '@/test/mocks/users';

import { NotParticipantError } from './errors/NotParticipantError';
import { GetPoolUserPredictionsUseCase } from './getPoolUserPredictionsUseCase';

describe('Get Pool User Predictions Use Case', () => {
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let poolAuthorizationService: PoolAuthorizationService;
  let sut: GetPoolUserPredictionsUseCase;

  let tournament: Tournament;
  let pool: Pool;
  let creator: User;
  let participant: User;
  let outsider: User;

  beforeEach(async () => {
    predictionsRepository = new InMemoryPredictionsRepository();
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();

    poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new GetPoolUserPredictionsUseCase(
      predictionsRepository,
      poolsRepository,
      poolAuthorizationService
    );

    creator = await createUser(usersRepository, { email: 'creator@test.com' });
    participant = await createUser(usersRepository, { email: 'participant@test.com' });
    outsider = await createUser(usersRepository, { email: 'outsider@test.com' });
    tournament = await createTournament(tournamentsRepository, { name: 'World Cup 2026' });
    pool = await createPool(poolsRepository, {
      tournamentId: tournament.id,
      creatorId: creator.id,
    });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: participant.id });
  });

  it('should return completed predictions with points and match data', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.COMPLETED,
        homeTeamScore: 2,
        awayTeamScore: 1,
      }
    );
    predictionsRepository.matches.push(match);
    predictionsRepository.teams.push(homeTeam, awayTeam);

    await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });

    const { predictions } = await sut.execute({
      poolId: pool.id,
      requesterId: creator.id,
      targetUserId: participant.id,
    });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].exactScore).toBe(true);
    expect(predictions[0].correctWinner).toBe(true);
    expect(predictions[0].match.homeTeam.name).toBeDefined();
    expect(predictions[0].match.status).toBe(MatchStatus.COMPLETED);
  });

  it('should exclude non-completed matches', async () => {
    const { match: completedMatch, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.COMPLETED,
        homeTeamScore: 1,
        awayTeamScore: 0,
      }
    );
    const { match: scheduledMatch } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED }
    );
    predictionsRepository.matches.push(completedMatch, scheduledMatch);
    predictionsRepository.teams.push(homeTeam, awayTeam);

    await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: completedMatch.id,
    });
    await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: scheduledMatch.id,
    });

    const { predictions } = await sut.execute({
      poolId: pool.id,
      requesterId: creator.id,
      targetUserId: participant.id,
    });

    expect(predictions).toHaveLength(1);
    expect(predictions[0].matchId).toBe(completedMatch.id);
  });

  it('should correctly compute correctWinner for wrong prediction', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.COMPLETED,
        homeTeamScore: 2,
        awayTeamScore: 1,
      }
    );
    predictionsRepository.matches.push(match);
    predictionsRepository.teams.push(homeTeam, awayTeam);

    await createPrediction(predictionsRepository, {
      userId: participant.id,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 0,
      predictedAwayScore: 2,
    });

    const { predictions } = await sut.execute({
      poolId: pool.id,
      requesterId: creator.id,
      targetUserId: participant.id,
    });

    expect(predictions[0].exactScore).toBe(false);
    expect(predictions[0].correctWinner).toBe(false);
  });

  it('should return empty array when user has no completed predictions', async () => {
    const { predictions } = await sut.execute({
      poolId: pool.id,
      requesterId: creator.id,
      targetUserId: participant.id,
    });

    expect(predictions).toHaveLength(0);
  });

  it('should throw NotParticipantError when requester is not a pool member', async () => {
    await expect(() =>
      sut.execute({ poolId: pool.id, requesterId: outsider.id, targetUserId: participant.id })
    ).rejects.toBeInstanceOf(NotParticipantError);
  });

  it('should throw ResourceNotFoundError when pool does not exist', async () => {
    await expect(() =>
      sut.execute({ poolId: 999, requesterId: creator.id, targetUserId: participant.id })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when targetUserId is not in the pool', async () => {
    await expect(() =>
      sut.execute({ poolId: pool.id, requesterId: creator.id, targetUserId: outsider.id })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should allow the creator to view their own predictions', async () => {
    const { match, homeTeam, awayTeam } = await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament.id,
        matchStatus: MatchStatus.COMPLETED,
        homeTeamScore: 1,
        awayTeamScore: 1,
      }
    );
    predictionsRepository.matches.push(match);
    predictionsRepository.teams.push(homeTeam, awayTeam);

    await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: match.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });

    const { predictions } = await sut.execute({
      poolId: pool.id,
      requesterId: creator.id,
      targetUserId: creator.id,
    });

    expect(predictions).toHaveLength(1);
  });
});
