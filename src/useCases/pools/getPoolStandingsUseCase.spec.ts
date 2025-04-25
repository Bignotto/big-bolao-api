import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { createPool } from '@/test/mocks/pools';
import { createTeam } from '@/test/mocks/teams';
import { createUser } from '@/test/mocks/users';
import { Match, MatchStage, MatchStatus, Pool, Team, User } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPoolStandingsUseCase } from './getPoolStandingsUseCase';

describe('GetPoolStandingsUseCase', () => {
  let poolsRepository: InMemoryPoolsRepository;
  let usersRepository: InMemoryUsersRepository;
  let matchesRepository: InMemoryMatchesRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let sut: GetPoolStandingsUseCase;

  let creator: User;
  let regularUser: User;
  let pool: Pool;
  let teams: Team[] = [];
  let matches: Match[] = [];

  beforeEach(async () => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    teamsRepository = new InMemoryTeamsRepository();
    matchesRepository = new InMemoryMatchesRepository();
    sut = new GetPoolStandingsUseCase(poolsRepository);

    creator = await createUser(usersRepository, {
      fullName: 'Creator User',
    });

    regularUser = await createUser(usersRepository, {
      fullName: 'Regular User',
    });

    pool = await createPool(poolsRepository, { creatorId: creator.id });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: regularUser.id });

    for (let i = 0; i < 5; i++) {
      const team = await createTeam(teamsRepository, {
        name: `Team ${i}`,
        countryCode: `TEAM-${i}`,
      });
      teams.push(team);
    }
    //NEXT: Create matches
    const matches = [
      {
        id: 1,
        tournamentId: 1,
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        homeScore: 2,
        awayScore: 1,
        matchDate: new Date(),
        matchStatus: MatchStatus.COMPLETED,
        stage: MatchStage.GROUP,
        hasExtraTime: false,
        hasPenalties: false,
      },
      {
        id: 2,
        tournamentId: 1,
        homeTeam: 'Team C',
        awayTeam: 'Team D',
        homeScore: 0,
        awayScore: 0,
        matchDate: new Date(),
        matchStatus: MatchStatus.COMPLETED,
        stage: MatchStage.GROUP,
        hasExtraTime: false,
        hasPenalties: false,
      },
      {
        id: 3,
        tournamentId: 1,
        homeTeam: 'Team A',
        awayTeam: 'Team C',
        homeScore: 3,
        awayScore: 1,
        matchDate: new Date(),
        matchStatus: MatchStatus.COMPLETED,
        stage: MatchStage.FINAL,
        hasExtraTime: false,
        hasPenalties: false,
      },
    ];

    // Create predictions
    const predictions = [
      // User 1 predictions
      {
        id: 1,
        userId: 'user-1',
        poolId: 1,
        matchId: 1,
        homeScore: 2,
        awayScore: 1, // Exact score - 3 points
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 'user-1',
        poolId: 1,
        matchId: 2,
        homeScore: 1,
        awayScore: 1, // Wrong score but correct draw - 1 point
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: 'user-1',
        poolId: 1,
        matchId: 3,
        homeScore: 2,
        awayScore: 0, // Correct winner but wrong score - 1 point * 2.0 (final) = 2 points
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // User 2 predictions
      {
        id: 4,
        userId: 'user-2',
        poolId: 1,
        matchId: 1,
        homeScore: 1,
        awayScore: 0, // Correct winner but wrong score - 1 point
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        userId: 'user-2',
        poolId: 1,
        matchId: 2,
        homeScore: 0,
        awayScore: 0, // Exact score - 3 points
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        userId: 'user-2',
        poolId: 1,
        matchId: 3,
        homeScore: 1,
        awayScore: 2, // Wrong winner - 0 points
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Set up the repository with test data
    poolsRepository.setTestData([pool], [scoringRule], participants, predictions, matches);

    // Create users for testing
    const users = [
      { id: 'user-1', name: 'User One', email: 'user1@example.com' },
      { id: 'user-2', name: 'User Two', email: 'user2@example.com' },
    ];

    // Add users to the users repository
    users.forEach((user) => usersRepository.create(user));
  });

  it('should correctly calculate points based on prediction accuracy', async () => {
    const { standings } = await sut.execute({ poolId: 1 });

    // User 1 should have 6 points (3 + 1 + 2)
    const user1Standing = standings.find((s) => s.userId === 'user-1');
    expect(user1Standing).toBeDefined();
    expect(user1Standing?.total_points).toBe(6);

    // User 2 should have 4 points (1 + 3 + 0)
    const user2Standing = standings.find((s) => s.userId === 'user-2');
    expect(user2Standing).toBeDefined();
    expect(user2Standing?.total_points).toBe(4);
  });

  it('should apply correct multipliers for knockout and final matches', async () => {
    // Add a new match (semifinal) and predictions to test knockout multiplier
    const semifinalMatch = {
      id: 4,
      tournamentId: 1,
      homeTeam: 'Team B',
      awayTeam: 'Team D',
      homeScore: 2,
      awayScore: 0,
      matchDate: new Date(),
      matchStatus: MatchStatus.FINISHED,
      stage: MatchStage.SEMIFINAL,
      hasExtraTime: false,
      hasPenalties: false,
    };

    await poolsRepository.addMatch(semifinalMatch);

    // Add exact score prediction for user 1 (3 points * 1.5 knockout multiplier = 4.5 points)
    await poolsRepository.addPrediction({
      id: 7,
      userId: 'user-1',
      poolId: 1,
      matchId: 4,
      homeScore: 2,
      awayScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { standings } = await sut.execute({ poolId: 1 });

    // User 1 should now have 10.5 points (3 + 1 + 2 + 4.5)
    const user1Standing = standings.find((s) => s.userId === 'user-1');
    expect(user1Standing).toBeDefined();
    expect(user1Standing?.total_points).toBe(10.5);
  });

  it('should throw ResourceNotFoundError when pool does not exist', async () => {
    await expect(sut.execute({ poolId: 999 })).rejects.toThrow(ResourceNotFoundError);
  });
});
