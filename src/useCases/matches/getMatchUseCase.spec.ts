import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { createMatch } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import { Match, MatchStage, MatchStatus, Team, Tournament } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMatchUseCase } from './getMatchUseCase';

// Define an extended Match type that includes the related entities
type MatchWithRelations = Match & {
  homeTeam: Team;
  awayTeam: Team;
  tournament: Tournament;
};

describe('Get Match Information Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let sut: GetMatchUseCase;

  let tournament: Tournament;
  let homeTeam: Team;
  let awayTeam: Team;
  let match: Match;

  beforeEach(async () => {
    matchesRepository = new InMemoryMatchesRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    sut = new GetMatchUseCase(matchesRepository);

    // Create a tournament
    tournament = await createTournament(tournamentsRepository, {});

    // Create teams
    homeTeam = await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' });
    awayTeam = await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' });

    // Create a match
    match = await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchStage: MatchStage.GROUP,
        matchStatus: MatchStatus.SCHEDULED,
      },
      homeTeam,
      awayTeam
    );

    // Setup the teams and tournaments in the matches repository for the getMatchWithTeams method
    matchesRepository.teams = teamsRepository.items;
    matchesRepository.tournaments = tournamentsRepository.tournaments;
  });

  it('should get match information successfully', async () => {
    // Execute the use case
    const result = await sut.execute({ matchId: match.id });

    // Use type assertion to tell TypeScript that result includes related entities
    const matchWithRelations = result as unknown as MatchWithRelations;

    // Assertions
    expect(matchWithRelations).toBeTruthy();
    expect(matchWithRelations.id).toEqual(match.id);
    expect(matchWithRelations.homeTeam).toBeTruthy();
    expect(matchWithRelations.homeTeam.id).toEqual(homeTeam.id);
    expect(matchWithRelations.homeTeam.name).toEqual(homeTeam.name);
    expect(matchWithRelations.homeTeam.countryCode).toEqual(homeTeam.countryCode);
    expect(matchWithRelations.awayTeam).toBeTruthy();
    expect(matchWithRelations.awayTeam.id).toEqual(awayTeam.id);
    expect(matchWithRelations.awayTeam.name).toEqual(awayTeam.name);
    expect(matchWithRelations.awayTeam.countryCode).toEqual(awayTeam.countryCode);
    expect(matchWithRelations.tournament).toBeTruthy();
    expect(matchWithRelations.tournament.id).toEqual(tournament.id);
    expect(matchWithRelations.tournament.name).toEqual(tournament.name);
  });

  it('should throw ResourceNotFoundError when match does not exist', async () => {
    // Execute the use case with a non-existent match ID
    await expect(sut.execute({ matchId: 999 })).rejects.toThrow(ResourceNotFoundError);
    await expect(sut.execute({ matchId: 999 })).rejects.toThrow('Match not found');
  });
});
