import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { createMatch, createMatchWithTeams } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { Match, Tournament } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTournamentMatchesUseCase } from './getTournamentMatchesUseCase';

describe('Get Tournament Matches Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let sut: GetTournamentMatchesUseCase;
  let tournament1: Tournament;
  let tournament2: Tournament;
  let matches: Match[];

  beforeEach(async () => {
    matchesRepository = new InMemoryMatchesRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();

    sut = new GetTournamentMatchesUseCase(matchesRepository, tournamentsRepository);

    // Create a mock tournament
    tournament1 = await tournamentsRepository.create({
      name: 'World Cup 2022',
      startDate: new Date('2022-11-20'),
      endDate: new Date('2022-12-18'),
      status: 'COMPLETED',
    });

    // Create a second tournament to test filtering
    tournament2 = await tournamentsRepository.create({
      name: 'Euro 2024',
      startDate: new Date('2024-06-14'),
      endDate: new Date('2024-07-14'),
      status: 'UPCOMING',
    });

    // Create mock matches for tournament 1
    matches = [];
    matches.push(
      await createMatch(
        matchesRepository,
        { tournamentId: tournament1.id },
        await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
        await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
      )
    );
    matches.push(
      await createMatch(
        matchesRepository,
        { tournamentId: tournament1.id },
        await createTeam(teamsRepository, { name: 'France', countryCode: 'FRA' }),
        await createTeam(teamsRepository, { name: 'Germany', countryCode: 'GER' })
      )
    );
    matches.push(
      await createMatch(
        matchesRepository,
        { tournamentId: tournament1.id },
        await createTeam(teamsRepository, { name: 'England', countryCode: 'ENG' }),
        await createTeam(teamsRepository, { name: 'Italia', countryCode: 'ITA' })
      )
    );

    // Create a match for tournament 2
    await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament2.id,
      }
    );

    await createMatchWithTeams(
      { matchesRepository, teamsRepository },
      {
        tournamentId: tournament2.id,
      }
    );
  });

  it('should be able to get all matches for a tournament', async () => {
    const result = await sut.execute({
      tournamentId: tournament1.id,
    });

    expect(result.matches).toHaveLength(3);
    expect(result.matches).toEqual(expect.arrayContaining(matches));
  });

  it('should return only matches for the specified tournament', async () => {
    const result = await sut.execute({
      tournamentId: tournament1.id,
    });

    // All returned matches should be for tournament 1
    result.matches.forEach((match) => {
      expect(match.tournamentId).toBe(1);
    });

    // Should have exactly 3 matches (the ones we created for tournament 1)
    expect(result.matches).toHaveLength(3);
  });

  it('should return an empty array when tournament has no matches', async () => {
    // Create a new tournament with no matches
    const otherTournament = await tournamentsRepository.create({
      name: 'Copa America 2024',
      startDate: new Date('2024-06-20'),
      endDate: new Date('2024-07-14'),
      status: 'UPCOMING',
    });

    const result = await sut.execute({
      tournamentId: otherTournament.id,
    });

    expect(result.matches).toHaveLength(0);
    expect(result.matches).toEqual([]);
  });

  it('should not be able to get matches for a non-existent tournament', async () => {
    await expect(() =>
      sut.execute({
        tournamentId: 999,
      })
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
