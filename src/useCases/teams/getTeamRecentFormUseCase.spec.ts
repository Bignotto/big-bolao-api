import { MatchStatus, Team, Tournament } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { createMatch } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';

import { GetTeamRecentFormUseCase } from './getTeamRecentFormUseCase';

describe('Get Team Recent Form Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let sut: GetTeamRecentFormUseCase;

  let tournament: Tournament;
  let teamA: Team;
  let teamB: Team;

  beforeEach(async () => {
    matchesRepository = new InMemoryMatchesRepository();
    teamsRepository = new InMemoryTeamsRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    sut = new GetTeamRecentFormUseCase(matchesRepository);

    tournament = await createTournament(tournamentsRepository, {});
    teamA = await createTeam(teamsRepository, { name: 'Brasil', countryCode: 'BRA' });
    teamB = await createTeam(teamsRepository, { name: 'Croácia', countryCode: 'CRO' });

    matchesRepository.teams = teamsRepository.items;
    matchesRepository.tournaments = tournamentsRepository.tournaments;
  });

  it('should return W for the home team that scored more goals', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, homeTeamScore: 2, awayTeamScore: 0, matchStatus: MatchStatus.COMPLETED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('W');
    expect(results[0].teamScore).toBe(2);
    expect(results[0].opponentScore).toBe(0);
  });

  it('should return L for the away team in the same 2–0 match', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, homeTeamScore: 2, awayTeamScore: 0, matchStatus: MatchStatus.COMPLETED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamB.id, limit: 3 });

    expect(results).toHaveLength(1);
    expect(results[0].result).toBe('L');
    expect(results[0].teamScore).toBe(0);
    expect(results[0].opponentScore).toBe(2);
  });

  it('should return D for a draw', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, homeTeamScore: 1, awayTeamScore: 1, matchStatus: MatchStatus.COMPLETED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results[0].result).toBe('D');
  });

  it('should keep result as D and set decidedOnPenalties when match had penalties', async () => {
    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        homeTeamScore: 1,
        awayTeamScore: 1,
        matchStatus: MatchStatus.COMPLETED,
        hasPenalties: true,
        penaltyHomeScore: 4,
        penaltyAwayScore: 2,
      },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results[0].result).toBe('D');
    expect(results[0].decidedOnPenalties).toBe(true);
  });

  it('should return empty array when team has no COMPLETED matches', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStatus: MatchStatus.SCHEDULED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results).toHaveLength(0);
  });

  it('should return fewer entries than limit when team has fewer completed matches', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, homeTeamScore: 1, awayTeamScore: 0, matchStatus: MatchStatus.COMPLETED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results).toHaveLength(1);
  });

  it('should return results ordered oldest to newest', async () => {
    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date('2026-06-20T15:00:00Z'),
        homeTeamScore: 3,
        awayTeamScore: 0,
        matchStatus: MatchStatus.COMPLETED,
      },
      teamA,
      teamB
    );

    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date('2026-06-10T15:00:00Z'),
        homeTeamScore: 1,
        awayTeamScore: 0,
        matchStatus: MatchStatus.COMPLETED,
      },
      teamA,
      teamB
    );

    await createMatch(
      matchesRepository,
      {
        tournamentId: tournament.id,
        matchDatetime: new Date('2026-06-15T15:00:00Z'),
        homeTeamScore: 2,
        awayTeamScore: 1,
        matchStatus: MatchStatus.COMPLETED,
      },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results).toHaveLength(3);
    expect(results[0].matchDatetime).toEqual(new Date('2026-06-10T15:00:00Z'));
    expect(results[1].matchDatetime).toEqual(new Date('2026-06-15T15:00:00Z'));
    expect(results[2].matchDatetime).toEqual(new Date('2026-06-20T15:00:00Z'));
  });

  it('should populate opponent fields from the correct team', async () => {
    await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, homeTeamScore: 1, awayTeamScore: 0, matchStatus: MatchStatus.COMPLETED },
      teamA,
      teamB
    );

    const { results } = await sut.execute({ teamId: teamA.id, limit: 3 });

    expect(results[0].opponentId).toBe(teamB.id);
    expect(results[0].opponentName).toBe(teamB.name);
    expect(results[0].opponentCode).toBe(teamB.countryCode);
  });
});
