import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryUsersRepository } from '@/repositories/users/InMemoryUsersRepository';
import { IUsersRepository } from '@/repositories/users/IUsersRepository';

import { DeleteUserUseCase } from './deleteUserUseCase';

let usersRepository: IUsersRepository;
let poolsRepository: IPoolsRepository;
let sut: DeleteUserUseCase;

describe('Delete User', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    poolsRepository = new InMemoryPoolsRepository();
    sut = new DeleteUserUseCase(usersRepository, poolsRepository);
  });

  it('should be able to delete a user', async () => {
    const user = await usersRepository.create({
      email: 'user@email.com',
      fullName: 'John Doe',
      accountProvider: 'EMAIL',
    });

    await sut.execute(user.id);

    const deletedUser = await usersRepository.findById(user.id);
    expect(deletedUser).toBeNull();
  });

  it('should not be able to delete a non-existing user', async () => {
    await expect(() => sut.execute('non-existing-id')).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  describe('pool ownership transfer', () => {
    it('should transfer pool ownership to the earliest-joined participant', async () => {
      const creator = await usersRepository.create({
        email: 'creator@email.com',
        fullName: 'Creator',
        accountProvider: 'EMAIL',
      });
      const firstJoiner = await usersRepository.create({
        email: 'first@email.com',
        fullName: 'First Joiner',
        accountProvider: 'EMAIL',
      });
      const secondJoiner = await usersRepository.create({
        email: 'second@email.com',
        fullName: 'Second Joiner',
        accountProvider: 'EMAIL',
      });

      const pool = await poolsRepository.create({
        name: 'Test Pool',
        isPrivate: false,
        tournament: { connect: { id: 1 } },
        creator: { connect: { id: creator.id } },
        inviteCode: 'TEST01',
        maxParticipants: 10,
        registrationDeadline: new Date(2099, 1, 1),
      });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: creator.id });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: firstJoiner.id });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: secondJoiner.id });

      await sut.execute(creator.id);

      const updatedPool = await poolsRepository.findById(pool.id);
      expect(updatedPool).not.toBeNull();
      expect(updatedPool?.creatorId).toEqual(firstJoiner.id);
    });

    it('should delete pool when creator is the only participant', async () => {
      const creator = await usersRepository.create({
        email: 'creator@email.com',
        fullName: 'Creator',
        accountProvider: 'EMAIL',
      });

      const pool = await poolsRepository.create({
        name: 'Empty Pool',
        isPrivate: false,
        tournament: { connect: { id: 1 } },
        creator: { connect: { id: creator.id } },
        inviteCode: 'EMPTY1',
        maxParticipants: 10,
        registrationDeadline: new Date(2099, 1, 1),
      });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: creator.id });

      await sut.execute(creator.id);

      const deletedPool = await poolsRepository.findById(pool.id);
      expect(deletedPool).toBeNull();
    });

    it('should handle multiple pools independently', async () => {
      const creator = await usersRepository.create({
        email: 'creator@email.com',
        fullName: 'Creator',
        accountProvider: 'EMAIL',
      });
      const otherUser = await usersRepository.create({
        email: 'other@email.com',
        fullName: 'Other User',
        accountProvider: 'EMAIL',
      });

      const poolWithParticipant = await poolsRepository.create({
        name: 'Pool With Participant',
        isPrivate: false,
        tournament: { connect: { id: 1 } },
        creator: { connect: { id: creator.id } },
        inviteCode: 'WPART1',
        maxParticipants: 10,
        registrationDeadline: new Date(2099, 1, 1),
      });
      await poolsRepository.addParticipant({ poolId: poolWithParticipant.id, userId: creator.id });
      await poolsRepository.addParticipant({ poolId: poolWithParticipant.id, userId: otherUser.id });

      const emptyPool = await poolsRepository.create({
        name: 'Empty Pool',
        isPrivate: false,
        tournament: { connect: { id: 1 } },
        creator: { connect: { id: creator.id } },
        inviteCode: 'EMPTY2',
        maxParticipants: 10,
        registrationDeadline: new Date(2099, 1, 1),
      });
      await poolsRepository.addParticipant({ poolId: emptyPool.id, userId: creator.id });

      await sut.execute(creator.id);

      const transferredPool = await poolsRepository.findById(poolWithParticipant.id);
      expect(transferredPool?.creatorId).toEqual(otherUser.id);

      const deletedPool = await poolsRepository.findById(emptyPool.id);
      expect(deletedPool).toBeNull();
    });

    it('should not affect pools where user is only a participant, not creator', async () => {
      const owner = await usersRepository.create({
        email: 'owner@email.com',
        fullName: 'Owner',
        accountProvider: 'EMAIL',
      });
      const participant = await usersRepository.create({
        email: 'participant@email.com',
        fullName: 'Participant',
        accountProvider: 'EMAIL',
      });

      const pool = await poolsRepository.create({
        name: 'Owner Pool',
        isPrivate: false,
        tournament: { connect: { id: 1 } },
        creator: { connect: { id: owner.id } },
        inviteCode: 'OWNPL1',
        maxParticipants: 10,
        registrationDeadline: new Date(2099, 1, 1),
      });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: owner.id });
      await poolsRepository.addParticipant({ poolId: pool.id, userId: participant.id });

      await sut.execute(participant.id);

      const unchangedPool = await poolsRepository.findById(pool.id);
      expect(unchangedPool?.creatorId).toEqual(owner.id);
    });
  });
});
