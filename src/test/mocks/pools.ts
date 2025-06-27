import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { faker } from '@faker-js/faker';
import { Pool, User } from '@prisma/client';
import { createUser } from './users';

export async function createPool(
  repository: IPoolsRepository,
  data: {
    name?: string;
    description?: string;
    tournamentId?: number;
    creatorId?: string;
    isPrivate?: boolean;
    inviteCode?: string;
  }
): Promise<Pool> {
  const randomPoolNumber = Math.floor(Math.random() * 100);

  const pool = await repository.create({
    name: data.name ?? `Pool ${randomPoolNumber}`,
    description: data.description ?? `Test pool description ${randomPoolNumber}`,
    tournament: { connect: { id: data.tournamentId ?? randomPoolNumber } },
    creator: { connect: { id: data.creatorId ?? `faker-${randomPoolNumber}` } },
    inviteCode: data.inviteCode ?? `invite-${randomPoolNumber}`,
    isPrivate: data.isPrivate ?? false,
  });

  await repository.createScoringRules({
    pool: { connect: { id: pool.id } },
    exactScorePoints: 10,
    correctWinnerGoalDiffPoints: 7,
    correctWinnerPoints: 5,
    correctDrawPoints: 5,
    specialEventPoints: 5,
    knockoutMultiplier: 1.5,
    finalMultiplier: 2.0,
  });

  await repository.addParticipant({
    poolId: pool.id,
    userId: data.creatorId ?? `faker-${randomPoolNumber}`,
  });

  return pool;
}

export async function createPoolWithParticipants(
  repositories: {
    poolsRepository: IPoolsRepository;
    usersRepository: IUsersRepository;
  },
  data: {
    name?: string;
    description?: string;
    tournamentId?: number;
    creatorId?: string;
    isPrivate?: boolean;
  }
): Promise<{
  pool: Pool;
  participants: User[];
}> {
  const userA = await createUser(repositories.usersRepository, {
    fullName: 'John Doe',
    email: faker.internet.email(),
    passwordHash: 'hashed-password',
  });

  const userB = await createUser(repositories.usersRepository, {
    fullName: 'Jane Smith',
    email: faker.internet.email(),
    passwordHash: 'hashed-password',
  });

  const pool = await createPool(repositories.poolsRepository, {
    creatorId: data.creatorId ?? userA.id,
    ...data,
  });

  if (data.creatorId)
    await repositories.poolsRepository.addParticipant({
      poolId: pool.id,
      userId: userA.id,
    });

  await repositories.poolsRepository.addParticipant({
    poolId: pool.id,
    userId: userB.id,
  });

  return {
    pool,
    participants: [userA, userB],
  };
}
