import { MatchStage, MatchStatus, PrismaClient, TournamentStatus } from '@prisma/client';
import { seedUsers } from './users.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create the World Cup tournament
  const worldCup = await prisma.tournament.create({
    data: {
      name: 'FIFA World Cup 2022',
      startDate: new Date('2022-11-20T00:00:00Z'),
      endDate: new Date('2022-12-18T00:00:00Z'),
      logoUrl:
        'https://digitalhub.fifa.com/transform/3a170d69-b0b5-4d0c-bca0-85880a60ea1a/World-Cup-logo',
      status: TournamentStatus.COMPLETED,
    },
  });

  console.log(`Created tournament: ${worldCup.name}`);

  // Create teams and map them for easy reference
  const teams = await createTeams();
  const teamMap = teams.reduce((acc: { [key: string]: number }, team) => {
    acc[team.name] = team.id;
    return acc;
  }, {});

  // Create users
  await seedUsers();

  // Assign teams to the tournament with their groups
  await assignTeamsToTournament(worldCup.id, teamMap);

  // Create group stage matches
  await createGroupMatches(worldCup.id, teamMap);

  // Create knockout stage matches
  await createKnockoutMatches(worldCup.id, teamMap);

  console.log('Seed completed successfully!');
}

async function createTeams() {
  const teamsData = [
    { name: 'Qatar', countryCode: 'QAT', flagUrl: 'https://flagcdn.com/qa.svg' },
    { name: 'Ecuador', countryCode: 'ECU', flagUrl: 'https://flagcdn.com/ec.svg' },
    { name: 'Senegal', countryCode: 'SEN', flagUrl: 'https://flagcdn.com/sn.svg' },
    { name: 'Netherlands', countryCode: 'NED', flagUrl: 'https://flagcdn.com/nl.svg' },
    { name: 'England', countryCode: 'ENG', flagUrl: 'https://flagcdn.com/gb-eng.svg' },
    { name: 'Iran', countryCode: 'IRN', flagUrl: 'https://flagcdn.com/ir.svg' },
    { name: 'USA', countryCode: 'USA', flagUrl: 'https://flagcdn.com/us.svg' },
    { name: 'Wales', countryCode: 'WAL', flagUrl: 'https://flagcdn.com/gb-wls.svg' },
    { name: 'Argentina', countryCode: 'ARG', flagUrl: 'https://flagcdn.com/ar.svg' },
    { name: 'Saudi Arabia', countryCode: 'KSA', flagUrl: 'https://flagcdn.com/sa.svg' },
    { name: 'Mexico', countryCode: 'MEX', flagUrl: 'https://flagcdn.com/mx.svg' },
    { name: 'Poland', countryCode: 'POL', flagUrl: 'https://flagcdn.com/pl.svg' },
    { name: 'France', countryCode: 'FRA', flagUrl: 'https://flagcdn.com/fr.svg' },
    { name: 'Australia', countryCode: 'AUS', flagUrl: 'https://flagcdn.com/au.svg' },
    { name: 'Denmark', countryCode: 'DEN', flagUrl: 'https://flagcdn.com/dk.svg' },
    { name: 'Tunisia', countryCode: 'TUN', flagUrl: 'https://flagcdn.com/tn.svg' },
    { name: 'Spain', countryCode: 'ESP', flagUrl: 'https://flagcdn.com/es.svg' },
    { name: 'Costa Rica', countryCode: 'CRC', flagUrl: 'https://flagcdn.com/cr.svg' },
    { name: 'Germany', countryCode: 'GER', flagUrl: 'https://flagcdn.com/de.svg' },
    { name: 'Japan', countryCode: 'JPN', flagUrl: 'https://flagcdn.com/jp.svg' },
    { name: 'Belgium', countryCode: 'BEL', flagUrl: 'https://flagcdn.com/be.svg' },
    { name: 'Canada', countryCode: 'CAN', flagUrl: 'https://flagcdn.com/ca.svg' },
    { name: 'Morocco', countryCode: 'MAR', flagUrl: 'https://flagcdn.com/ma.svg' },
    { name: 'Croatia', countryCode: 'CRO', flagUrl: 'https://flagcdn.com/hr.svg' },
    { name: 'Brazil', countryCode: 'BRA', flagUrl: 'https://flagcdn.com/br.svg' },
    { name: 'Serbia', countryCode: 'SRB', flagUrl: 'https://flagcdn.com/rs.svg' },
    { name: 'Switzerland', countryCode: 'SUI', flagUrl: 'https://flagcdn.com/ch.svg' },
    { name: 'Cameroon', countryCode: 'CMR', flagUrl: 'https://flagcdn.com/cm.svg' },
    { name: 'Portugal', countryCode: 'POR', flagUrl: 'https://flagcdn.com/pt.svg' },
    { name: 'Ghana', countryCode: 'GHA', flagUrl: 'https://flagcdn.com/gh.svg' },
    { name: 'Uruguay', countryCode: 'URU', flagUrl: 'https://flagcdn.com/uy.svg' },
    { name: 'South Korea', countryCode: 'KOR', flagUrl: 'https://flagcdn.com/kr.svg' },
  ];

  const teams = [];
  for (const team of teamsData) {
    const createdTeam = await prisma.team.create({
      data: team,
    });
    teams.push(createdTeam);
    console.log(`Created team: ${team.name}`);
  }

  return teams;
}

interface GroupAssignment {
  group: string;
  teams: string[];
}

async function assignTeamsToTournament(tournamentId: number, teamMap: { [key: string]: number }) {
  const groupAssignments: GroupAssignment[] = [
    { group: 'A', teams: ['Qatar', 'Ecuador', 'Senegal', 'Netherlands'] },
    { group: 'B', teams: ['England', 'Iran', 'USA', 'Wales'] },
    { group: 'C', teams: ['Argentina', 'Saudi Arabia', 'Mexico', 'Poland'] },
    { group: 'D', teams: ['France', 'Australia', 'Denmark', 'Tunisia'] },
    { group: 'E', teams: ['Spain', 'Costa Rica', 'Germany', 'Japan'] },
    { group: 'F', teams: ['Belgium', 'Canada', 'Morocco', 'Croatia'] },
    { group: 'G', teams: ['Brazil', 'Serbia', 'Switzerland', 'Cameroon'] },
    { group: 'H', teams: ['Portugal', 'Ghana', 'Uruguay', 'South Korea'] },
  ];

  for (const group of groupAssignments) {
    for (const teamName of group.teams) {
      await prisma.tournamentTeam.create({
        data: {
          tournamentId: tournamentId,
          teamId: teamMap[teamName],
          groupName: group.group,
        },
      });
      console.log(`Assigned ${teamName} to Group ${group.group}`);
    }
  }
}

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  stage: string;
  group: string;
  stadium: string;
  homeScore: number;
  awayScore: number;
}

async function createGroupMatches(tournamentId: number, teamMap: { [key: string]: number }) {
  const groupMatches: MatchData[] = [
    // Group A
    {
      homeTeam: 'Qatar',
      awayTeam: 'Ecuador',
      datetime: '2022-11-20T16:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Al Bayt Stadium',
      homeScore: 0,
      awayScore: 2,
    },
    {
      homeTeam: 'Senegal',
      awayTeam: 'Netherlands',
      datetime: '2022-11-21T16:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Al Thumama Stadium',
      homeScore: 0,
      awayScore: 2,
    },
    {
      homeTeam: 'Qatar',
      awayTeam: 'Senegal',
      datetime: '2022-11-25T13:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Al Thumama Stadium',
      homeScore: 1,
      awayScore: 3,
    },
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Ecuador',
      datetime: '2022-11-25T16:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Khalifa International Stadium',
      homeScore: 1,
      awayScore: 1,
    },
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Qatar',
      datetime: '2022-11-29T15:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Al Bayt Stadium',
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: 'Ecuador',
      awayTeam: 'Senegal',
      datetime: '2022-11-29T15:00:00Z',
      stage: 'Group A',
      group: 'A',
      stadium: 'Khalifa International Stadium',
      homeScore: 1,
      awayScore: 2,
    },

    // Group B
    {
      homeTeam: 'England',
      awayTeam: 'Iran',
      datetime: '2022-11-21T13:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Khalifa International Stadium',
      homeScore: 6,
      awayScore: 2,
    },
    {
      homeTeam: 'USA',
      awayTeam: 'Wales',
      datetime: '2022-11-21T19:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 1,
      awayScore: 1,
    },
    {
      homeTeam: 'Wales',
      awayTeam: 'Iran',
      datetime: '2022-11-25T10:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 0,
      awayScore: 2,
    },
    {
      homeTeam: 'England',
      awayTeam: 'USA',
      datetime: '2022-11-25T19:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Al Bayt Stadium',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Wales',
      awayTeam: 'England',
      datetime: '2022-11-29T19:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 0,
      awayScore: 3,
    },
    {
      homeTeam: 'Iran',
      awayTeam: 'USA',
      datetime: '2022-11-29T19:00:00Z',
      stage: 'Group B',
      group: 'B',
      stadium: 'Al Thumama Stadium',
      homeScore: 0,
      awayScore: 1,
    },

    // Group C
    {
      homeTeam: 'Argentina',
      awayTeam: 'Saudi Arabia',
      datetime: '2022-11-22T10:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Lusail Stadium',
      homeScore: 1,
      awayScore: 2,
    },
    {
      homeTeam: 'Mexico',
      awayTeam: 'Poland',
      datetime: '2022-11-22T16:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Stadium 974',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Poland',
      awayTeam: 'Saudi Arabia',
      datetime: '2022-11-26T13:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Education City Stadium',
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Mexico',
      datetime: '2022-11-26T19:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Lusail Stadium',
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: 'Poland',
      awayTeam: 'Argentina',
      datetime: '2022-11-30T19:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Stadium 974',
      homeScore: 0,
      awayScore: 2,
    },
    {
      homeTeam: 'Saudi Arabia',
      awayTeam: 'Mexico',
      datetime: '2022-11-30T19:00:00Z',
      stage: 'Group C',
      group: 'C',
      stadium: 'Lusail Stadium',
      homeScore: 1,
      awayScore: 2,
    },

    // Group D
    {
      homeTeam: 'Denmark',
      awayTeam: 'Tunisia',
      datetime: '2022-11-22T13:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Education City Stadium',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Australia',
      datetime: '2022-11-22T19:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Al Janoub Stadium',
      homeScore: 4,
      awayScore: 1,
    },
    {
      homeTeam: 'Tunisia',
      awayTeam: 'Australia',
      datetime: '2022-11-26T10:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Al Janoub Stadium',
      homeScore: 0,
      awayScore: 1,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Denmark',
      datetime: '2022-11-26T16:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Stadium 974',
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'Tunisia',
      awayTeam: 'France',
      datetime: '2022-11-30T15:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Education City Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Australia',
      awayTeam: 'Denmark',
      datetime: '2022-11-30T15:00:00Z',
      stage: 'Group D',
      group: 'D',
      stadium: 'Al Janoub Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    // Group E
    {
      homeTeam: 'Germany',
      awayTeam: 'Japan',
      datetime: '2022-11-23T13:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Khalifa International Stadium',
      homeScore: 1,
      awayScore: 2,
    },
    {
      homeTeam: 'Spain',
      awayTeam: 'Costa Rica',
      datetime: '2022-11-23T16:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Al Thumama Stadium',
      homeScore: 7,
      awayScore: 0,
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'Costa Rica',
      datetime: '2022-11-27T10:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 0,
      awayScore: 1,
    },
    {
      homeTeam: 'Spain',
      awayTeam: 'Germany',
      datetime: '2022-11-27T19:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Al Bayt Stadium',
      homeScore: 1,
      awayScore: 1,
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'Spain',
      datetime: '2022-12-01T19:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Khalifa International Stadium',
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'Costa Rica',
      awayTeam: 'Germany',
      datetime: '2022-12-01T19:00:00Z',
      stage: 'Group E',
      group: 'E',
      stadium: 'Al Bayt Stadium',
      homeScore: 2,
      awayScore: 4,
    },

    // Group F
    {
      homeTeam: 'Morocco',
      awayTeam: 'Croatia',
      datetime: '2022-11-23T10:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Al Bayt Stadium',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Belgium',
      awayTeam: 'Canada',
      datetime: '2022-11-23T19:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Belgium',
      awayTeam: 'Morocco',
      datetime: '2022-11-27T13:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Al Thumama Stadium',
      homeScore: 0,
      awayScore: 2,
    },
    {
      homeTeam: 'Croatia',
      awayTeam: 'Canada',
      datetime: '2022-11-27T16:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Khalifa International Stadium',
      homeScore: 4,
      awayScore: 1,
    },
    {
      homeTeam: 'Croatia',
      awayTeam: 'Belgium',
      datetime: '2022-12-01T15:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Canada',
      awayTeam: 'Morocco',
      datetime: '2022-12-01T15:00:00Z',
      stage: 'Group F',
      group: 'F',
      stadium: 'Al Thumama Stadium',
      homeScore: 1,
      awayScore: 2,
    },

    // Group G
    {
      homeTeam: 'Switzerland',
      awayTeam: 'Cameroon',
      datetime: '2022-11-24T10:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Al Janoub Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Brazil',
      awayTeam: 'Serbia',
      datetime: '2022-11-24T19:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Lusail Stadium',
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: 'Cameroon',
      awayTeam: 'Serbia',
      datetime: '2022-11-28T10:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Al Janoub Stadium',
      homeScore: 3,
      awayScore: 3,
    },
    {
      homeTeam: 'Brazil',
      awayTeam: 'Switzerland',
      datetime: '2022-11-28T16:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Stadium 974',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Cameroon',
      awayTeam: 'Brazil',
      datetime: '2022-12-02T19:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Lusail Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'Serbia',
      awayTeam: 'Switzerland',
      datetime: '2022-12-02T19:00:00Z',
      stage: 'Group G',
      group: 'G',
      stadium: 'Stadium 974',
      homeScore: 2,
      awayScore: 3,
    },
    // Group H
    {
      homeTeam: 'Uruguay',
      awayTeam: 'South Korea',
      datetime: '2022-11-24T13:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Education City Stadium',
      homeScore: 0,
      awayScore: 0,
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Ghana',
      datetime: '2022-11-24T16:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Stadium 974',
      homeScore: 3,
      awayScore: 2,
    },
    {
      homeTeam: 'South Korea',
      awayTeam: 'Ghana',
      datetime: '2022-11-28T13:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Education City Stadium',
      homeScore: 2,
      awayScore: 3,
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Uruguay',
      datetime: '2022-11-28T19:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Lusail Stadium',
      homeScore: 2,
      awayScore: 0,
    },
    {
      homeTeam: 'South Korea',
      awayTeam: 'Portugal',
      datetime: '2022-12-02T15:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Education City Stadium',
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'Ghana',
      awayTeam: 'Uruguay',
      datetime: '2022-12-02T15:00:00Z',
      stage: 'Group H',
      group: 'H',
      stadium: 'Al Janoub Stadium',
      homeScore: 0,
      awayScore: 2,
    },
  ];

  // Create all group matches
  for (const match of groupMatches) {
    await prisma.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: teamMap[match.homeTeam],
        awayTeamId: teamMap[match.awayTeam],
        matchDatetime: new Date(match.datetime),
        stadium: match.stadium,
        stage: MatchStage.GROUP,
        group: match.group,
        homeTeamScore: match.homeScore,
        awayTeamScore: match.awayScore,
        matchStatus: MatchStatus.COMPLETED,
      },
    });
    console.log(`Created match: ${match.homeTeam} vs ${match.awayTeam}`);
  }
}

interface KnockoutMatchData {
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  stage: MatchStage;
  stadium: string;
  homeScore: number;
  awayScore: number;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
}

async function createKnockoutMatches(tournamentId: number, teamMap: { [key: string]: number }) {
  const knockoutMatches: KnockoutMatchData[] = [
    // Round of 16
    {
      homeTeam: 'Netherlands',
      awayTeam: 'USA',
      datetime: '2022-12-03T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Khalifa International Stadium',
      homeScore: 3,
      awayScore: 1,
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Australia',
      datetime: '2022-12-03T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Ahmad Bin Ali Stadium',
      homeScore: 2,
      awayScore: 1,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Poland',
      datetime: '2022-12-04T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Thumama Stadium',
      homeScore: 3,
      awayScore: 1,
    },
    {
      homeTeam: 'England',
      awayTeam: 'Senegal',
      datetime: '2022-12-04T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Bayt Stadium',
      homeScore: 3,
      awayScore: 0,
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'Croatia',
      datetime: '2022-12-05T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Al Janoub Stadium',
      homeScore: 1,
      awayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 1,
      penaltyAwayScore: 3,
    },
    {
      homeTeam: 'Brazil',
      awayTeam: 'South Korea',
      datetime: '2022-12-05T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Stadium 974',
      homeScore: 4,
      awayScore: 1,
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Spain',
      datetime: '2022-12-06T15:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Education City Stadium',
      homeScore: 0,
      awayScore: 0,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 3,
      penaltyAwayScore: 0,
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Switzerland',
      datetime: '2022-12-06T19:00:00Z',
      stage: MatchStage.ROUND_OF_16,
      stadium: 'Lusail Stadium',
      homeScore: 6,
      awayScore: 1,
    },

    // Quarter-finals
    {
      homeTeam: 'Croatia',
      awayTeam: 'Brazil',
      datetime: '2022-12-09T15:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Education City Stadium',
      homeScore: 1,
      awayScore: 1,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 4,
      penaltyAwayScore: 2,
    },
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Argentina',
      datetime: '2022-12-09T19:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 2,
      awayScore: 2,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 3,
      penaltyAwayScore: 4,
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Portugal',
      datetime: '2022-12-10T15:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Al Thumama Stadium',
      homeScore: 1,
      awayScore: 0,
    },
    {
      homeTeam: 'England',
      awayTeam: 'France',
      datetime: '2022-12-10T19:00:00Z',
      stage: MatchStage.QUARTER_FINAL,
      stadium: 'Al Bayt Stadium',
      homeScore: 1,
      awayScore: 2,
    },

    // Semi-finals
    {
      homeTeam: 'Argentina',
      awayTeam: 'Croatia',
      datetime: '2022-12-13T19:00:00Z',
      stage: MatchStage.SEMI_FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 3,
      awayScore: 0,
    },
    {
      homeTeam: 'France',
      awayTeam: 'Morocco',
      datetime: '2022-12-14T19:00:00Z',
      stage: MatchStage.SEMI_FINAL,
      stadium: 'Al Bayt Stadium',
      homeScore: 2,
      awayScore: 0,
    },

    // Third place play-off
    {
      homeTeam: 'Croatia',
      awayTeam: 'Morocco',
      datetime: '2022-12-17T15:00:00Z',
      stage: MatchStage.THIRD_PLACE,
      stadium: 'Khalifa International Stadium',
      homeScore: 2,
      awayScore: 1,
    },

    // Final
    {
      homeTeam: 'Argentina',
      awayTeam: 'France',
      datetime: '2022-12-18T15:00:00Z',
      stage: MatchStage.FINAL,
      stadium: 'Lusail Stadium',
      homeScore: 3,
      awayScore: 3,
      hasExtraTime: true,
      hasPenalties: true,
      penaltyHomeScore: 4,
      penaltyAwayScore: 2,
    },
  ];

  for (const match of knockoutMatches) {
    await prisma.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: teamMap[match.homeTeam],
        awayTeamId: teamMap[match.awayTeam],
        matchDatetime: new Date(match.datetime),
        stadium: match.stadium,
        stage: match.stage,
        homeTeamScore: match.homeScore,
        awayTeamScore: match.awayScore,
        matchStatus: MatchStatus.COMPLETED,
        hasExtraTime: match.hasExtraTime || false,
        hasPenalties: match.hasPenalties || false,
        penaltyHomeScore: match.penaltyHomeScore,
        penaltyAwayScore: match.penaltyAwayScore,
      },
    });
    console.log(`Created knockout match: ${match.homeTeam} vs ${match.awayTeam}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
