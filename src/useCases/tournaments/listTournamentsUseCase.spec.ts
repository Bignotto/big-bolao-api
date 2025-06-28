import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { ITournamentsRepository } from '@/repositories/tournaments/ITournamentsRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTournamentsUseCase } from './listTournamentsUseCase';

let tournamentsRepository: ITournamentsRepository;
let sut: ListTournamentsUseCase;

describe('List Tournaments Use Case', () => {
  beforeEach(() => {
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new ListTournamentsUseCase(tournamentsRepository);
  });

  it('should be able to list all tournaments', async () => {
    // Arrange
    await tournamentsRepository.create({ name: 'Tournament 1' });
    await tournamentsRepository.create({ name: 'Tournament 2' });

    // Act
    const { tournaments } = await sut.execute();

    // Assert
    expect(tournaments).toHaveLength(2);
    expect(tournaments[0].name).toBe('Tournament 1');
    expect(tournaments[1].name).toBe('Tournament 2');
  });
});
