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
  const useraA = await createUser(repositories.usersRepository, {
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
    creatorId: data.creatorId ?? useraA.id,
    ...data,
  });

  if (data.creatorId)
    await repositories.poolsRepository.addParticipant({
      poolId: pool.id,
      userId: useraA.id,
    });

  await repositories.poolsRepository.addParticipant({
    poolId: pool.id,
    userId: userB.id,
  });

  return {
    pool,
    participants: [useraA, userB],
  };
}
