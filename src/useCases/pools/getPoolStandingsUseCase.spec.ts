import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryPredictionsRepository } from '@/repositories/predictions/InMemoryPredictionsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';
import { createMatch } from '@/test/mocks/match';
import { createPool } from '@/test/mocks/pools';
import { createPrediction } from '@/test/mocks/predictions';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';
import { Match, MatchStage, MatchStatus, Pool, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPoolStandingsUseCase } from './getPoolStandingsUseCase';

describe('GetPoolStandingsUseCase', () => {
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let predictionsRepository: InMemoryPredictionsRepository;
  let poolAuthorizationService: PoolAuthorizationService;
  let sut: GetPoolStandingsUseCase;

  let creator: User;
  let regularUser: User;
  let pool: Pool;
  let matches: Match[] = [];

  beforeEach(async () => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();
    predictionsRepository = new InMemoryPredictionsRepository();
    poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new GetPoolStandingsUseCase(poolsRepository, poolAuthorizationService);

    creator = await createUser(usersRepository, {
      fullName: 'Creator User',
    });

    regularUser = await createUser(usersRepository, {
      fullName: 'Regular User',
    });

    pool = await createPool(poolsRepository, { creatorId: creator.id });

    await poolsRepository.addParticipant({ poolId: pool.id, userId: regularUser.id });

    matches.push(
      await createMatch(
        matchesRepository,
        {
          tournamentId: pool.tournamentId,
          homeTeamScore: 2,
          awayTeamScore: 3,
          matchStatus: MatchStatus.COMPLETED,
          matchStage: MatchStage.GROUP,
          hasExtraTime: false,
          hasPenalties: false,
        },
        await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
        await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
      )
    );
    matches.push(
      await createMatch(
        matchesRepository,
        {
          tournamentId: pool.tournamentId,
          homeTeamScore: 0,
          awayTeamScore: 0,
          matchStatus: MatchStatus.COMPLETED,
          matchStage: MatchStage.GROUP,
          hasExtraTime: false,
          hasPenalties: false,
        },
        await createTeam(teamsRepository, { name: 'France', countryCode: 'FRA' }),
        await createTeam(teamsRepository, { name: 'England', countryCode: 'ENG' })
      )
    );
    matches.push(
      await createMatch(
        matchesRepository,
        {
          tournamentId: pool.tournamentId,
          homeTeamScore: 3,
          awayTeamScore: 1,
          matchStatus: MatchStatus.COMPLETED,
          matchStage: MatchStage.GROUP,
          hasExtraTime: false,
          hasPenalties: false,
        },
        await createTeam(teamsRepository, { name: 'Germany', countryCode: 'GER' }),
        await createTeam(teamsRepository, { name: 'Italy', countryCode: 'ITA' })
      )
    );
    matches.push(
      await createMatch(
        matchesRepository,
        {
          tournamentId: pool.tournamentId,
          homeTeamScore: 1,
          awayTeamScore: 4,
          matchStatus: MatchStatus.COMPLETED,
          matchStage: MatchStage.GROUP,
          hasExtraTime: false,
          hasPenalties: false,
        },
        await createTeam(teamsRepository, { name: 'Italy', countryCode: 'ITA' }),
        await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' })
      )
    );

    await createPrediction(predictionsRepository, {
      userId: regularUser.id,
      poolId: pool.id,
      matchId: matches[0].id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    });
    await createPrediction(predictionsRepository, {
      userId: regularUser.id,
      poolId: pool.id,
      matchId: matches[1].id,
      predictedHomeScore: 0,
      predictedAwayScore: 0,
    });
    await createPrediction(predictionsRepository, {
      userId: regularUser.id,
      poolId: pool.id,
      matchId: matches[2].id,
      predictedHomeScore: 3,
      predictedAwayScore: 2,
    });
    await createPrediction(predictionsRepository, {
      userId: regularUser.id,
      poolId: pool.id,
      matchId: matches[3].id,
      predictedHomeScore: 3,
      predictedAwayScore: 0,
    });

    await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: matches[0].id,
      predictedHomeScore: 2,
      predictedAwayScore: 3,
    });
    await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: matches[1].id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
    });
    await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: matches[2].id,
      predictedHomeScore: 2,
      predictedAwayScore: 3,
    });
    await createPrediction(predictionsRepository, {
      userId: creator.id,
      poolId: pool.id,
      matchId: matches[3].id,
      predictedHomeScore: 0,
      predictedAwayScore: 3,
    });

    poolsRepository.matches = matches;
    poolsRepository.predictions = predictionsRepository.predictions;
  });

  /*
  This test has no purpose, since the points are calculated in the database.
  */
  it('should correctly calculate points based on prediction accuracy', async () => {
    const { standings } = await sut.execute({ poolId: pool.id, userId: creator.id });

    const user1Standing = standings.find((s) => s.userId === creator.id);
    expect(user1Standing).toBeDefined();
    expect(user1Standing?.totalPoints).toBe(22);

    const user2Standing = standings.find((s) => s.userId === regularUser.id);
    expect(user2Standing).toBeDefined();
    expect(user2Standing?.totalPoints).toBe(15);
  });

  it('should throw ResourceNotFoundError when pool does not exist', async () => {
    await expect(sut.execute({ poolId: 999, userId: regularUser.id })).rejects.toThrow(
      ResourceNotFoundError
    );
  });

  it('should return standings with all columns not null', async () => {
    const { standings } = await sut.execute({ poolId: pool.id, userId: creator.id });

    standings.forEach((standing) => {
      expect(standing.userId).not.toBeNull();
      expect(standing.fullName).not.toBeNull();
      expect(standing.profileImageUrl).not.toBeNull();
      expect(standing.totalPoints).not.toBeNull();
      expect(standing.ranking).not.toBeNull();
    });
  });
});
