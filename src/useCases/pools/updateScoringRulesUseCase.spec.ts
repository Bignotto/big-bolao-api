import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { PoolAuthorizationService } from '@/services/pools/PoolAuthorizationService';

import { NotPoolCreatorError } from './errors/NotPoolCreatorError';
import { UpdateScoringRulesUseCase } from './updateScoringRulesUseCase';

let poolsRepository: IPoolsRepository;
let usersRepository: IUsersRepository;
let poolAuthorizationService: PoolAuthorizationService;
let sut: UpdateScoringRulesUseCase;

describe('Update Scoring Rules Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    usersRepository = new InMemoryUsersRepository();
    poolAuthorizationService = new PoolAuthorizationService(poolsRepository);
    sut = new UpdateScoringRulesUseCase(poolsRepository, usersRepository, poolAuthorizationService);
  });

  it('should be able to update scoring rules', async () => {
    const user = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'My Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 5,
      correctWinnerGoalDiffPoints: 3,
      correctWinnerPoints: 2,
      correctDrawPoints: 2,
      specialEventPoints: 3,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    const updated = await sut.execute({
      poolId: pool.id,
      userId: user.id,
      exactScorePoints: 10,
      correctWinnerGoalDiffPoints: 6,
      correctWinnerPoints: 4,
      correctDrawPoints: 4,
      knockoutMultiplier: 2.0,
      finalMultiplier: 3.0,
    });

    expect(updated.exactScorePoints).toEqual(10);
    expect(updated.correctWinnerGoalDiffPoints).toEqual(6);
    expect(updated.correctWinnerPoints).toEqual(4);
    expect(updated.correctDrawPoints).toEqual(4);
    expect(new Prisma.Decimal(updated.knockoutMultiplier).toNumber()).toEqual(2.0);
    expect(new Prisma.Decimal(updated.finalMultiplier).toNumber()).toEqual(3.0);
  });

  it('should only update the fields that are provided', async () => {
    const user = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'My Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 5,
      correctWinnerGoalDiffPoints: 3,
      correctWinnerPoints: 2,
      correctDrawPoints: 2,
      specialEventPoints: 3,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    const updated = await sut.execute({
      poolId: pool.id,
      userId: user.id,
      exactScorePoints: 10,
      // all other fields omitted
    });

    expect(updated.exactScorePoints).toEqual(10);
    expect(updated.correctWinnerGoalDiffPoints).toEqual(3); // unchanged
    expect(updated.correctWinnerPoints).toEqual(2);         // unchanged
    expect(updated.correctDrawPoints).toEqual(2);           // unchanged
    expect(new Prisma.Decimal(updated.knockoutMultiplier).toNumber()).toEqual(1.5); // unchanged
    expect(new Prisma.Decimal(updated.finalMultiplier).toNumber()).toEqual(2.0);    // unchanged
  });

  it('should not be able to update scoring rules with a non-existing user', async () => {
    const pool = await poolsRepository.create({
      name: 'My Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'some-user-id' } },
      isPrivate: false,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 5,
      correctWinnerGoalDiffPoints: 3,
      correctWinnerPoints: 2,
      correctDrawPoints: 2,
      specialEventPoints: 3,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: 'non-existing-user-id',
        exactScorePoints: 10,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to update scoring rules for a non-existing pool', async () => {
    const user = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    await expect(() =>
      sut.execute({
        poolId: 999,
        userId: user.id,
        exactScorePoints: 10,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow a non-creator to update scoring rules', async () => {
    const creator = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const otherUser = await usersRepository.create({
      email: 'other@email.com',
      fullName: 'Other User',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'My Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: creator.id } },
      isPrivate: false,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 5,
      correctWinnerGoalDiffPoints: 3,
      correctWinnerPoints: 2,
      correctDrawPoints: 2,
      specialEventPoints: 3,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: otherUser.id,
        exactScorePoints: 10,
      })
    ).rejects.toBeInstanceOf(NotPoolCreatorError);
  });

  it('should throw ResourceNotFoundError when pool has no scoring rules', async () => {
    const user = await usersRepository.create({
      email: 'creator@email.com',
      fullName: 'Pool Creator',
      accountProvider: 'EMAIL',
    });

    const pool = await poolsRepository.create({
      name: 'My Pool',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: user.id } },
      isPrivate: false,
    });

    // Scoring rules are NOT created for this pool

    await expect(() =>
      sut.execute({
        poolId: pool.id,
        userId: user.id,
        exactScorePoints: 10,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
