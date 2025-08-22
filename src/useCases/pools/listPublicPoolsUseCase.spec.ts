import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryPoolsRepository } from '@/repositories/pools/InMemoryPoolsRepository';
import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';

import { ListPublicPoolsUseCase } from './listPublicPoolsUseCase';

let poolsRepository: IPoolsRepository;
let sut: ListPublicPoolsUseCase;

describe('List Public Pools Use Case', () => {
  beforeEach(() => {
    poolsRepository = new InMemoryPoolsRepository();
    sut = new ListPublicPoolsUseCase(poolsRepository);
  });

  it('should list public pools with pagination', async () => {
    await poolsRepository.create({
      name: 'Public Pool 1',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'user-1' } },
      isPrivate: false,
    });
    await poolsRepository.create({
      name: 'Public Pool 2',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'user-1' } },
      isPrivate: false,
    });
    await poolsRepository.create({
      name: 'Public Pool 3',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'user-1' } },
      isPrivate: false,
    });

    const { pools: firstPage } = await sut.execute({ page: 1, perPage: 2 });
    const { pools: secondPage } = await sut.execute({ page: 2, perPage: 2 });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
  });

  it('should filter pools by name', async () => {
    await poolsRepository.create({
      name: 'Champions League',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'user-1' } },
      isPrivate: false,
    });
    await poolsRepository.create({
      name: 'World Cup',
      tournament: { connect: { id: 1 } },
      creator: { connect: { id: 'user-1' } },
      isPrivate: false,
    });

    const { pools } = await sut.execute({ page: 1, perPage: 10, name: 'world' });

    expect(pools).toHaveLength(1);
    expect(pools[0].name).toBe('World Cup');
  });
});
