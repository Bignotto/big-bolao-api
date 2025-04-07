import { InMemoryMatchesRepository } from '@/repositories/matches/InMemoryMatchesRepository';
import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';
import { InMemoryTournamentsRepository } from '@/repositories/tournaments/InMemoryTournamentsRepository';
import { createMatch } from '@/test/mocks/match';
import { createTeam } from '@/test/mocks/teams';
import { createTournament } from '@/test/mocks/tournament';
import { Match, MatchStage, MatchStatus, Tournament } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateMatchUseCase } from './updateMatchUseCase';

describe('Update Match Use Case', () => {
  let matchesRepository: InMemoryMatchesRepository;
  let tournamentsRepository: InMemoryTournamentsRepository;
  let teamsRepository: InMemoryTeamsRepository;
  let sut: UpdateMatchUseCase;

  let tournament: Tournament;
  let match: Match;
  let knockoutMatch: Match;

  beforeEach(async () => {
    matchesRepository = new InMemoryMatchesRepository();
    tournamentsRepository = new InMemoryTournamentsRepository();
    teamsRepository = new InMemoryTeamsRepository();
    sut = new UpdateMatchUseCase(matchesRepository, tournamentsRepository);

    // Create a tournament
    tournament = await createTournament(tournamentsRepository, {});

    // Create a match
    match = await createMatch(
      matchesRepository,
      { tournamentId: tournament.id },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );

    // Create a knockout match
    knockoutMatch = await createMatch(
      matchesRepository,
      { tournamentId: tournament.id, matchStage: MatchStage.FINAL },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );
  });

  it('should update a match successfully', async () => {
    const otherTeam = await createTeam(teamsRepository, { name: 'Germany', countryCode: 'GER' });
    // Update the match
    const updatedMatch = await sut.execute({
      matchId: match.id,
      homeTeam: otherTeam.id,
      homeScore: 2,
      awayScore: 1,
      matchStatus: MatchStatus.COMPLETED,
    });

    expect(updatedMatch.id).toEqual(match.id);
    expect(updatedMatch.homeTeamId).toEqual(otherTeam.id);
    expect(updatedMatch.homeTeamScore).toEqual(2);
    expect(updatedMatch.awayTeamScore).toEqual(1);
    expect(updatedMatch.matchStatus).toEqual(MatchStatus.COMPLETED);
    expect(updatedMatch.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw an error when match does not exist', async () => {
    await expect(
      sut.execute({
        matchId: 999,
        homeTeam: 1,
        homeScore: 2,
      })
    ).rejects.toThrow('Match not found');
  });

  it('should throw an error when tournament does not exist', async () => {
    // Create a match with a non-existent tournament
    const matchWithInvalidTournament = await createMatch(
      matchesRepository,
      { tournamentId: 999 },
      await createTeam(teamsRepository, { name: 'Brazil', countryCode: 'BRA' }),
      await createTeam(teamsRepository, { name: 'Argentina', countryCode: 'ARG' })
    );

    matchesRepository.matches.push(matchWithInvalidTournament);

    await expect(
      sut.execute({
        matchId: matchWithInvalidTournament.id,
        homeScore: 2,
        awayScore: 1,
      })
    ).rejects.toThrow('Tournament not found');
  });

  it('should not allow negative scores in match updates', async () => {
    // Attempt to update with negative home score
    await expect(
      sut.execute({
        matchId: match.id,
        homeScore: -1,
        awayScore: 2,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Home score cannot be negative');

    // Attempt to update with negative away score
    await expect(
      sut.execute({
        matchId: match.id,
        homeScore: 2,
        awayScore: -1,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Away score cannot be negative');
  });

  it('should not allow extra time for group stage matches', async () => {
    await expect(
      sut.execute({
        matchId: match.id,
        hasExtraTime: true,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Group stage matches cannot have extra time');
  });

  it('should not allow penalties if extra time is not set', async () => {
    await expect(
      sut.execute({
        matchId: match.id,
        hasPenalties: true,
        homeScore: 1,
        awayScore: 1,
        penaltyAwayScore: 3,
        penaltyHomeScore: 2,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalties can only be set when extra time is set');
  });

  it('should validate that penalties can only be set when scores are tied', async () => {
    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        hasExtraTime: true,
        homeScore: 2,
        awayScore: 1,
        hasPenalties: true,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalties can only occur when scores are tied after regular/extra time');
  });

  it('should validate that penalty scores are provided when penalties are set', async () => {
    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        homeScore: 1,
        awayScore: 1,
        hasExtraTime: true,
        hasPenalties: true,
        // Missing penalty scores
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalty scores must be provided when penalties are set');
  });

  it('should validate that penalty scores are not negative', async () => {
    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        homeScore: 1,
        awayScore: 1,
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: -1,
        penaltyAwayScore: 5,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalty scores cannot be negative');

    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        homeScore: 1,
        awayScore: 1,
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: -1,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalty scores cannot be negative');
  });

  it('should validate that penalty scores cannot be tied', async () => {
    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        homeScore: 1,
        awayScore: 1,
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 5,
        matchStatus: MatchStatus.COMPLETED,
      })
    ).rejects.toThrow('Penalty scores cannot be tied');
  });

  it('should successfully update a match with penalties', async () => {
    // Update the match with penalties
    const updatedMatch = await sut.execute({
      matchId: knockoutMatch.id,
      homeScore: 1,
      awayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 5,
      penaltyAwayScore: 4,
      matchStatus: MatchStatus.COMPLETED,
    });

    expect(updatedMatch.id).toEqual(knockoutMatch.id);
    expect(updatedMatch.homeTeamScore).toEqual(1);
    expect(updatedMatch.awayTeamScore).toEqual(1);
    expect(updatedMatch.hasExtraTime).toEqual(true);
    expect(updatedMatch.hasPenalties).toEqual(true);
    expect(updatedMatch.penaltyHomeScore).toEqual(5);
    expect(updatedMatch.penaltyAwayScore).toEqual(4);
    expect(updatedMatch.matchStatus).toEqual(MatchStatus.COMPLETED);
  });

  //should be able to update a group match to a knokout match
  it('should be able to update a group match to a knockout match', async () => {
    // Update the match to a knockout match
    const updatedMatch = await sut.execute({
      matchId: match.id,
      matchStatus: MatchStatus.SCHEDULED,
      matchStage: MatchStage.ROUND_OF_16,
    });

    expect(updatedMatch.id).toEqual(match.id);
    expect(updatedMatch.stage).toEqual(MatchStage.ROUND_OF_16);
    expect(updatedMatch.matchStatus).toEqual(MatchStatus.SCHEDULED);
  });

  //should be able to update a knockout match to a group match
  it('should be able to update a knockout match to a group match', async () => {
    // Update the match to a knockout match
    const updatedMatch = await sut.execute({
      matchId: knockoutMatch.id,
      matchStatus: MatchStatus.SCHEDULED,
      matchStage: MatchStage.GROUP,
    });

    expect(updatedMatch.id).toEqual(knockoutMatch.id);
    expect(updatedMatch.stage).toEqual(MatchStage.GROUP);
    expect(updatedMatch.matchStatus).toEqual(MatchStatus.SCHEDULED);
  });

  //should not be able to set score, extra time or penalties for a scheduled match
  it('should not be able to set score, extra time or penalties for a scheduled match', async () => {
    await expect(
      sut.execute({
        matchId: knockoutMatch.id,
        homeScore: 2,
        awayScore: 2,
        hasExtraTime: true,
        hasPenalties: true,
        penaltyHomeScore: 5,
        penaltyAwayScore: 4,
      })
    ).rejects.toThrow('Cannot set score, extra time, or penalties for a scheduled match');
  });
});
