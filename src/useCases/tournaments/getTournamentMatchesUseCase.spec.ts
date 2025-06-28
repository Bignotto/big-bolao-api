import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTournamentMatchesUseCase } from './getTournamentMatchesUseCase';

describe('Get Tournament Matches Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let sut: GetTournamentMatchesUseCase;

  beforeEach(() => {
    matchesRepository = new InMemoryMatchesRepository();
    sut = new GetTournamentMatchesUseCase(matchesRepository);
  });

  it('should be able to get all matches for a tournament', async () => {
    // Arrange
    for (let i = 1; i <= 3; i++) {
      await matchesRepository.create({
        tournament: { connect: { id: 1 } },
        homeTeam: { connect: { id: i } },
        awayTeam: { connect: { id: i + 3 } },
        matchDatetime: new Date(),
      });
    }
    await matchesRepository.create({
      tournament: { connect: { id: 2 } },
      homeTeam: { connect: { id: 1 } },
      awayTeam: { connect: { id: 2 } },
      matchDatetime: new Date(),
    });

    // Act
    const { matches } = await sut.execute({ tournamentId: 1 });

    // Assert
    expect(matches).toHaveLength(3);
    expect(matches.every((m) => m.tournamentId === 1)).toBe(true);
  });
});