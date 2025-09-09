import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';

import { GetPoolByInviteUseCase } from './getPoolByInviteUseCase';

let poolsRepository: IPoolsRepository;
let tournamentsRepository: ITournamentsRepository;
let sut: GetPoolByInviteUseCase;

describe('Get Pool By Invite Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new GetPoolByInviteUseCase(poolsRepository, tournamentsRepository);
  });

  it('should return pool info by invite code with scoring rules, tournament and participants count', async () => {
    const tournament = await tournamentsRepository.create({
      name: 'World Cup',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-31'),
    });

    const registrationDeadline = new Date('2026-05-01T00:00:00Z');

    const pool = await poolsRepository.create({
      name: 'Invite Pool',
      description: 'Private pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: 'creator-1' } },
      isPrivate: true,
      inviteCode: 'INV-123',
      maxParticipants: 100,
      registrationDeadline,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 5,
      correctWinnerPoints: 3,
      correctDrawPoints: 2,
      correctWinnerGoalDiffPoints: 4,
      specialEventPoints: 7,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.5,
    });

    await poolsRepository.addParticipant({ poolId: pool.id, userId: 'creator-1' });
    await poolsRepository.addParticipant({ poolId: pool.id, userId: 'user-2' });

    const result = await sut.execute({ inviteCode: 'INV-123' });

    expect(result).toBeDefined();
    expect(result.id).toBe(pool.id);
    expect(result.name).toBe('Invite Pool');
    expect(result.description).toBe('Private pool');
    expect(result.isPrivate).toBe(true);
    expect(result.inviteCode).toBe('INV-123');
    expect(result.maxParticipants).toBe(100);
    expect(result.registrationDeadline?.getTime()).toBe(registrationDeadline.getTime());
    expect(result.creatorId).toBe('creator-1');
    expect(result.tournamentId).toBe(tournament.id);
    expect(result.tournament).toEqual(expect.objectContaining({ id: tournament.id, name: 'World Cup' }));
    expect(result.participantsCount).toBe(2);

    expect(result.scoringRules).toEqual(
      expect.objectContaining({
        exactScorePoints: 5,
        correctWinnerPoints: 3,
        correctDrawPoints: 2,
        correctWinnerGoalDiffPoints: 4,
        knockoutMultiplier: 1.5,
        finalMultiplier: 2.5,
      })
    );
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw when invite code does not exist', async () => {
    await expect(() => sut.execute({ inviteCode: 'DOES-NOT-EXIST' })).rejects.toBeInstanceOf(
      ResourceNotFoundError
    );
  });

  it('should throw when pool has no scoring rules', async () => {
    const tournament = await tournamentsRepository.create({
      name: 'World Cup',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-31'),
    });

    await poolsRepository.create({
      name: 'No Rules Pool',
      tournament: { connect: { id: tournament.id } },
      creator: { connect: { id: 'creator-1' } },
      inviteCode: 'INV-NO-RULES',
      isPrivate: false,
    });

    await expect(() => sut.execute({ inviteCode: 'INV-NO-RULES' })).rejects.toBeInstanceOf(
      ResourceNotFoundError
    );
  });

  it('should throw when tournament linked to pool does not exist', async () => {
    const pool = await poolsRepository.create({
      name: 'Orphan Tournament Pool',
      tournament: { connect: { id: 999 } },
      creator: { connect: { id: 'creator-1' } },
      inviteCode: 'INV-ORPHAN',
      isPrivate: false,
    });

    await poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 1,
      correctWinnerPoints: 1,
      correctDrawPoints: 1,
      correctWinnerGoalDiffPoints: 1,
      specialEventPoints: 0,
      knockoutMultiplier: 1,
      finalMultiplier: 1,
    });

    await expect(() => sut.execute({ inviteCode: 'INV-ORPHAN' })).rejects.toBeInstanceOf(
      ResourceNotFoundError
    );
  });
});

