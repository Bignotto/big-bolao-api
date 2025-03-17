import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetPoolUseCase } from './getPoolUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let sut: GetPoolUseCase;

describe('Get Pool Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    sut = new GetPoolUseCase(poolsRepository, usersRepository);
  });

  it.only('should be able to get pool information with participants and scoring rules', async () => {
    // Create a user (pool creator)
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    // Create additional participants
    const participant1 = await usersRepository.create({
      email: 'participant1@email.com',
      fullName: 'Participant One',
      accountProvider: 'EMAIL',
    });

    const participant2 = await usersRepository.create({
      email: 'participant2@email.com',
      fullName: 'Participant Two',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      description: 'A test pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: false,
    });

    // Add participants to the pool
    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creator.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant1.id,
    });

    await poolsRepository.addParticipant({
      poolId: pool.id,
      userId: participant2.id,
    });

    // Create scoring rules for the pool
    const scoringRules = await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 3,
      correctWinnerGoalDiffPoints: 2,
      correctWinnerPoints: 1,
      correctDrawPoints: 1,
      specialEventPoints: 5,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    // // Mock the getPoolParticipants method to return our participants
    // vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([
    //   { userId: creator.id },
    //   { userId: participant1.id },
    //   { userId: participant2.id },
    // ]);

    // // Mock the getScoringRules method to return our scoring rules
    // vi.spyOn(poolsRepository, 'getScoringRules').mockResolvedValue(scoringRules);

    // Execute the use case
    const result = await sut.execute({
      poolId: pool.id,
      userId: creator.id,
    });

    // Assertions
    expect(result).toEqual(
      expect.objectContaining({
        id: pool.id,
        name: 'Test Pool',
        description: 'A test pool',
        isPrivate: false,
        participants: expect.arrayContaining([
          expect.objectContaining({
            id: creator.id,
            fullName: 'Pool Creator',
          }),
          expect.objectContaining({
            id: participant1.id,
            fullName: 'Participant One',
          }),
          expect.objectContaining({
            id: participant2.id,
            fullName: 'Participant Two',
          }),
        ]),
        scoringRules: expect.objectContaining({
          exactScorePoints: 3,
          correctWinnerGoalDiffPoints: 2,
          correctWinnerPoints: 1,
          correctDrawPoints: 1,
          specialEventPoints: 5,
          knockoutMultiplier: 1.5,
          finalMultiplier: 2.0,
        }),
      })
    );
    //expect(result.participants).toHaveLength(3);
  });

  it('should not be able to get pool information with non-existing user', async () => {
    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'existing-user-id' } },
    });

    // Attempt to get pool with non-existing user
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: 'non-existing-user-id',
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to get non-existing pool', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Attempt to get non-existing pool
    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error if scoring rules are not found', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Test Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
    });

    // Mock getPoolParticipants to return empty array
    vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([]);

    // Mock getScoringRules to return null (no scoring rules found)
    vi.spyOn(poolsRepository, 'getScoringRules').mockResolvedValue(null);

    // Attempt to get pool with missing scoring rules
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: user.id,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: user.id,
      })
    ).rejects.toThrow('Scoring rules not found for this pool');
  });

  it('should return empty participants array when pool has no participants', async () => {
    // Create a user
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    // Create a pool
    const pool = await poolsRepository.create({
      name: 'Empty Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
    });

    // Create scoring rules
    const scoringRules = await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 3,
      correctWinnerGoalDiffPoints: 2,
      correctWinnerPoints: 1,
      correctDrawPoints: 1,
      specialEventPoints: 5,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    // Mock getPoolParticipants to return empty array
    vi.spyOn(poolsRepository, 'getPoolParticipants').mockResolvedValue([]);

    // Mock getScoringRules to return our scoring rules
    vi.spyOn(poolsRepository, 'getScoringRules').mockResolvedValue(scoringRules);

    // Execute the use case
    const result = await sut.execute({
      poolId: pool.id,
      userId: user.id,
    });

    // Assertions
    expect(result.participants).toEqual([]);
    expect(result.scoringRules).toEqual(
      expect.objectContaining({
        exactScorePoints: 3,
      })
    );
  });
});
