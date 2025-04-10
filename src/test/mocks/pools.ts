import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';
import { Pool, User } from '@prisma/client';
import { createUser } from './users';

export async function createPool(
  repository: IPoolsRepository,
  data: {
    name?: string;
    tournamentId?: number;
    creatorId?: string;
    isPrivate?: boolean;
  }
): Promise<Pool> {
  const randomPoolNumber = Math.floor(Math.random() * 100);

  const pool = await repository.create({
    name: data.name ?? `Pool ${randomPoolNumber}`,
    tournament: { connect: { id: data.tournamentId ?? randomPoolNumber } },
    creator: { connect: { id: data.creatorId ?? `faker-${randomPoolNumber}` } },
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
    email: 'john@example.com',
    passwordHash: 'hashed-password',
  });

  const userB = await createUser(repositories.usersRepository, {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
  });

  const pool = await createPool(repositories.poolsRepository, {
    creatorId: useraA.id,
    ...data,
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
