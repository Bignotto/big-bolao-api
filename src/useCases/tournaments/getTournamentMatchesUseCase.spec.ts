import { beforeEach, describe, expect, it } from 'vitest';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';

import { GetTournamentMatchesUseCase } from './getTournamentMatchesUseCase';

describe('Get Tournament Matches Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let sut: GetTournamentMatchesUseCase;

  beforeEach(() => {
    matchesRepository = new InMemoryMatchesRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new GetTournamentMatchesUseCase(matchesRepository, tournamentsRepository);
  });

  it('should be able to get all matches for a tournament', async () => {
    // Arrange
    const tournament1 = await tournamentsRepository.create({
      name: 'Tournament 1',
      startDate: new Date(),
      endDate: new Date(),
    });
    const tournament2 = await tournamentsRepository.create({
      name: 'Tournament 2',
      startDate: new Date(),
      endDate: new Date(),
    });

    for (let i = 1; i <= 3; i++) {
      await matchesRepository.create({
        tournament: { connect: { id: tournament1.id } },
        homeTeam: { connect: { id: i } },
        awayTeam: { connect: { id: i + 3 } },
        matchDatetime: new Date(),
      });
    }
    await matchesRepository.create({
      tournament: { connect: { id: tournament2.id } },
      homeTeam: { connect: { id: 1 } },
      awayTeam: { connect: { id: 2 } },
      matchDatetime: new Date(),
    });

    // Act
    const { matches } = await sut.execute({ tournamentId: tournament1.id });

    // Assert
    expect(matches).toHaveLength(3);
    expect(matches.every((m) => m.tournamentId === tournament1.id)).toBe(true);
  });

  it('should throw if tournament does not exist', async () => {
    await expect(() => sut.execute({ tournamentId: 999 })).rejects.toBeInstanceOf(
      ResourceNotFoundError
    );
  });
});
