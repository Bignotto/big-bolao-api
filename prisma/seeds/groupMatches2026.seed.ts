import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  group: string;
  stadium: string;
}

export async function createGroupMatches2026(tournamentId: number, teamMap: { [key: string]: number }) {
  // ⚠️ Match times are approximate UTC kickoff times based on the published schedule.
  //    Exact times should be verified against the official FIFA schedule.
  // Stadiums are the 16 official 2026 World Cup venues across USA, Canada, and Mexico.
  const groupMatches: MatchData[] = [
    // ── GROUP A ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Mexico',
      awayTeam: 'South Africa',
      datetime: '2026-06-11T22:00:00Z', // Opening match — Estadio Azteca
      group: 'A',
      stadium: 'Estadio Azteca, Mexico City',
    },
    {
      homeTeam: 'South Korea',
      awayTeam: 'UEFA Playoff D Winner',
      datetime: '2026-06-12T01:00:00Z',
      group: 'A',
      stadium: 'SoFi Stadium, Los Angeles',
    },
    {
      homeTeam: 'Mexico',
      awayTeam: 'UEFA Playoff D Winner',
      datetime: '2026-06-17T01:00:00Z',
      group: 'A',
      stadium: 'Estadio Guadalajara, Guadalajara',
    },
    {
      homeTeam: 'South Africa',
      awayTeam: 'South Korea',
      datetime: '2026-06-17T22:00:00Z',
      group: 'A',
      stadium: 'Levi\'s Stadium, San Francisco',
    },
    {
      homeTeam: 'South Korea',
      awayTeam: 'Mexico',
      datetime: '2026-06-22T22:00:00Z',
      group: 'A',
      stadium: 'AT&T Stadium, Dallas',
    },
    {
      homeTeam: 'UEFA Playoff D Winner',
      awayTeam: 'South Africa',
      datetime: '2026-06-22T22:00:00Z',
      group: 'A',
      stadium: 'Arrowhead Stadium, Kansas City',
    },

    // ── GROUP B ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Canada',
      awayTeam: 'UEFA Playoff A Winner',
      datetime: '2026-06-12T22:00:00Z',
      group: 'B',
      stadium: 'BMO Field, Toronto',
    },
    {
      homeTeam: 'Switzerland',
      awayTeam: 'Qatar',
      datetime: '2026-06-13T01:00:00Z',
      group: 'B',
      stadium: 'Hard Rock Stadium, Miami',
    },
    {
      homeTeam: 'Canada',
      awayTeam: 'Qatar',
      datetime: '2026-06-17T22:00:00Z',
      group: 'B',
      stadium: 'BC Place, Vancouver',
    },
    {
      homeTeam: 'Switzerland',
      awayTeam: 'UEFA Playoff A Winner',
      datetime: '2026-06-18T01:00:00Z',
      group: 'B',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Qatar',
      awayTeam: 'UEFA Playoff A Winner',
      datetime: '2026-06-23T22:00:00Z',
      group: 'B',
      stadium: 'NRG Stadium, Houston',
    },
    {
      homeTeam: 'Switzerland',
      awayTeam: 'Canada',
      datetime: '2026-06-23T22:00:00Z',
      group: 'B',
      stadium: 'Lincoln Financial Field, Philadelphia',
    },

    // ── GROUP C ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Brazil',
      awayTeam: 'Morocco',
      datetime: '2026-06-13T22:00:00Z',
      group: 'C',
      stadium: 'AT&T Stadium, Dallas',
    },
    {
      homeTeam: 'Haiti',
      awayTeam: 'Curaçao',
      datetime: '2026-06-14T01:00:00Z',
      group: 'C',
      stadium: 'Hard Rock Stadium, Miami',
    },
    {
      homeTeam: 'Brazil',
      awayTeam: 'Haiti',
      datetime: '2026-06-18T22:00:00Z',
      group: 'C',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Curaçao',
      datetime: '2026-06-19T01:00:00Z',
      group: 'C',
      stadium: 'SoFi Stadium, Los Angeles',
    },
    {
      homeTeam: 'Curaçao',
      awayTeam: 'Brazil',
      datetime: '2026-06-24T22:00:00Z',
      group: 'C',
      stadium: 'Levi\'s Stadium, San Francisco',
    },
    {
      homeTeam: 'Morocco',
      awayTeam: 'Haiti',
      datetime: '2026-06-24T22:00:00Z',
      group: 'C',
      stadium: 'Arrowhead Stadium, Kansas City',
    },

    // ── GROUP D ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'United States',
      awayTeam: 'Paraguay',
      datetime: '2026-06-14T22:00:00Z',
      group: 'D',
      stadium: 'SoFi Stadium, Los Angeles',
    },
    {
      homeTeam: 'Australia',
      awayTeam: 'UEFA Playoff C Winner',
      datetime: '2026-06-15T01:00:00Z',
      group: 'D',
      stadium: 'AT&T Stadium, Dallas',
    },
    {
      homeTeam: 'United States',
      awayTeam: 'Australia',
      datetime: '2026-06-19T22:00:00Z',
      group: 'D',
      stadium: 'Levi\'s Stadium, San Francisco',
    },
    {
      homeTeam: 'Paraguay',
      awayTeam: 'UEFA Playoff C Winner',
      datetime: '2026-06-20T01:00:00Z',
      group: 'D',
      stadium: 'Mercedes-Benz Stadium, Atlanta',
    },
    {
      homeTeam: 'Paraguay',
      awayTeam: 'Australia',
      datetime: '2026-06-25T22:00:00Z',
      group: 'D',
      stadium: 'Hard Rock Stadium, Miami',
    },
    {
      homeTeam: 'UEFA Playoff C Winner',
      awayTeam: 'United States',
      datetime: '2026-06-25T22:00:00Z',
      group: 'D',
      stadium: 'Gillette Stadium, Boston',
    },

    // ── GROUP E ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Germany',
      awayTeam: 'Côte d\'Ivoire',
      datetime: '2026-06-15T22:00:00Z',
      group: 'E',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Ecuador',
      awayTeam: 'TBD Group E',
      datetime: '2026-06-16T01:00:00Z',
      group: 'E',
      stadium: 'NRG Stadium, Houston',
    },
    {
      homeTeam: 'Germany',
      awayTeam: 'Ecuador',
      datetime: '2026-06-20T22:00:00Z',
      group: 'E',
      stadium: 'Gillette Stadium, Boston',
    },
    {
      homeTeam: 'Côte d\'Ivoire',
      awayTeam: 'TBD Group E',
      datetime: '2026-06-21T01:00:00Z',
      group: 'E',
      stadium: 'Lincoln Financial Field, Philadelphia',
    },
    {
      homeTeam: 'Côte d\'Ivoire',
      awayTeam: 'Germany',
      datetime: '2026-06-26T22:00:00Z',
      group: 'E',
      stadium: 'Arrowhead Stadium, Kansas City',
    },
    {
      homeTeam: 'TBD Group E',
      awayTeam: 'Ecuador',
      datetime: '2026-06-26T22:00:00Z',
      group: 'E',
      stadium: 'Mercedes-Benz Stadium, Atlanta',
    },

    // ── GROUP F ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Japan',
      datetime: '2026-06-15T19:00:00Z',
      group: 'F',
      stadium: 'Lumen Field, Seattle',
    },
    {
      homeTeam: 'Tunisia',
      awayTeam: 'UEFA Playoff B Winner',
      datetime: '2026-06-16T22:00:00Z',
      group: 'F',
      stadium: 'BC Place, Vancouver',
    },
    {
      homeTeam: 'Netherlands',
      awayTeam: 'Tunisia',
      datetime: '2026-06-21T19:00:00Z',
      group: 'F',
      stadium: 'SoFi Stadium, Los Angeles',
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'UEFA Playoff B Winner',
      datetime: '2026-06-21T22:00:00Z',
      group: 'F',
      stadium: 'AT&T Stadium, Dallas',
    },
    {
      homeTeam: 'Japan',
      awayTeam: 'Tunisia',
      datetime: '2026-06-26T19:00:00Z',
      group: 'F',
      stadium: 'Lumen Field, Seattle',
    },
    {
      homeTeam: 'UEFA Playoff B Winner',
      awayTeam: 'Netherlands',
      datetime: '2026-06-26T19:00:00Z',
      group: 'F',
      stadium: 'BMO Field, Toronto',
    },

    // ── GROUP G ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Belgium',
      awayTeam: 'Egypt',
      datetime: '2026-06-16T19:00:00Z',
      group: 'G',
      stadium: 'Lincoln Financial Field, Philadelphia',
    },
    {
      homeTeam: 'Iran',
      awayTeam: 'New Zealand',
      datetime: '2026-06-17T19:00:00Z',
      group: 'G',
      stadium: 'Estadio Monterrey, Monterrey',
    },
    {
      homeTeam: 'Belgium',
      awayTeam: 'Iran',
      datetime: '2026-06-22T19:00:00Z',
      group: 'G',
      stadium: 'Mercedes-Benz Stadium, Atlanta',
    },
    {
      homeTeam: 'Egypt',
      awayTeam: 'New Zealand',
      datetime: '2026-06-22T19:00:00Z',
      group: 'G',
      stadium: 'NRG Stadium, Houston',
    },
    {
      homeTeam: 'Egypt',
      awayTeam: 'Belgium',
      datetime: '2026-06-27T19:00:00Z',
      group: 'G',
      stadium: 'Gillette Stadium, Boston',
    },
    {
      homeTeam: 'New Zealand',
      awayTeam: 'Iran',
      datetime: '2026-06-27T19:00:00Z',
      group: 'G',
      stadium: 'Levi\'s Stadium, San Francisco',
    },

    // ── GROUP H ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Spain',
      awayTeam: 'Cabo Verde',
      datetime: '2026-06-16T16:00:00Z',
      group: 'H',
      stadium: 'Hard Rock Stadium, Miami',
    },
    {
      homeTeam: 'Saudi Arabia',
      awayTeam: 'Uruguay',
      datetime: '2026-06-17T16:00:00Z',
      group: 'H',
      stadium: 'Estadio Azteca, Mexico City',
    },
    {
      homeTeam: 'Spain',
      awayTeam: 'Saudi Arabia',
      datetime: '2026-06-21T16:00:00Z',
      group: 'H',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Cabo Verde',
      awayTeam: 'Uruguay',
      datetime: '2026-06-22T16:00:00Z',
      group: 'H',
      stadium: 'BC Place, Vancouver',
    },
    {
      homeTeam: 'Cabo Verde',
      awayTeam: 'Spain',
      datetime: '2026-06-27T22:00:00Z',
      group: 'H',
      stadium: 'Arrowhead Stadium, Kansas City',
    },
    {
      homeTeam: 'Uruguay',
      awayTeam: 'Saudi Arabia',
      datetime: '2026-06-27T22:00:00Z',
      group: 'H',
      stadium: 'Lumen Field, Seattle',
    },

    // ── GROUP I ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'France',
      awayTeam: 'Senegal',
      datetime: '2026-06-18T19:00:00Z',
      group: 'I',
      stadium: 'Gillette Stadium, Boston',
    },
    {
      homeTeam: 'Norway',
      awayTeam: 'Inter-Confederation Playoff 2 Winner',
      datetime: '2026-06-18T16:00:00Z',
      group: 'I',
      stadium: 'Estadio Monterrey, Monterrey',
    },
    {
      homeTeam: 'France',
      awayTeam: 'Norway',
      datetime: '2026-06-23T19:00:00Z',
      group: 'I',
      stadium: 'Mercedes-Benz Stadium, Atlanta',
    },
    {
      homeTeam: 'Senegal',
      awayTeam: 'Inter-Confederation Playoff 2 Winner',
      datetime: '2026-06-23T16:00:00Z',
      group: 'I',
      stadium: 'Estadio Guadalajara, Guadalajara',
    },
    {
      homeTeam: 'Senegal',
      awayTeam: 'France',
      datetime: '2026-06-27T16:00:00Z',
      group: 'I',
      stadium: 'Lincoln Financial Field, Philadelphia',
    },
    {
      homeTeam: 'Inter-Confederation Playoff 2 Winner',
      awayTeam: 'Norway',
      datetime: '2026-06-27T16:00:00Z',
      group: 'I',
      stadium: 'NRG Stadium, Houston',
    },

    // ── GROUP J ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Argentina',
      awayTeam: 'Algeria',
      datetime: '2026-06-19T19:00:00Z',
      group: 'J',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Austria',
      awayTeam: 'Jordan',
      datetime: '2026-06-19T16:00:00Z',
      group: 'J',
      stadium: 'Estadio Azteca, Mexico City',
    },
    {
      homeTeam: 'Argentina',
      awayTeam: 'Austria',
      datetime: '2026-06-23T19:00:00Z',
      group: 'J',
      stadium: 'Lumen Field, Seattle',
    },
    {
      homeTeam: 'Algeria',
      awayTeam: 'Jordan',
      datetime: '2026-06-24T16:00:00Z',
      group: 'J',
      stadium: 'Estadio Guadalajara, Guadalajara',
    },
    {
      homeTeam: 'Algeria',
      awayTeam: 'Austria',
      datetime: '2026-06-28T19:00:00Z',
      group: 'J',
      stadium: 'SoFi Stadium, Los Angeles',
    },
    {
      homeTeam: 'Jordan',
      awayTeam: 'Argentina',
      datetime: '2026-06-28T19:00:00Z',
      group: 'J',
      stadium: 'Hard Rock Stadium, Miami',
    },

    // ── GROUP K ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'Portugal',
      awayTeam: 'Colombia',
      datetime: '2026-06-20T19:00:00Z',
      group: 'K',
      stadium: 'NRG Stadium, Houston',
    },
    {
      homeTeam: 'Uzbekistan',
      awayTeam: 'Inter-Confederation Playoff 1 Winner',
      datetime: '2026-06-20T16:00:00Z',
      group: 'K',
      stadium: 'Estadio Monterrey, Monterrey',
    },
    {
      homeTeam: 'Portugal',
      awayTeam: 'Uzbekistan',
      datetime: '2026-06-24T19:00:00Z',
      group: 'K',
      stadium: 'Arrowhead Stadium, Kansas City',
    },
    {
      homeTeam: 'Colombia',
      awayTeam: 'Inter-Confederation Playoff 1 Winner',
      datetime: '2026-06-25T16:00:00Z',
      group: 'K',
      stadium: 'Levi\'s Stadium, San Francisco',
    },
    {
      homeTeam: 'Colombia',
      awayTeam: 'Uzbekistan',
      datetime: '2026-06-28T22:00:00Z',
      group: 'K',
      stadium: 'BMO Field, Toronto',
    },
    {
      homeTeam: 'Inter-Confederation Playoff 1 Winner',
      awayTeam: 'Portugal',
      datetime: '2026-06-28T22:00:00Z',
      group: 'K',
      stadium: 'BC Place, Vancouver',
    },

    // ── GROUP L ──────────────────────────────────────────────────────────────
    {
      homeTeam: 'England',
      awayTeam: 'Croatia',
      datetime: '2026-06-20T01:00:00Z',
      group: 'L',
      stadium: 'Gillette Stadium, Boston',
    },
    {
      homeTeam: 'Ghana',
      awayTeam: 'Panama',
      datetime: '2026-06-21T01:00:00Z',
      group: 'L',
      stadium: 'Lincoln Financial Field, Philadelphia',
    },
    {
      homeTeam: 'England',
      awayTeam: 'Ghana',
      datetime: '2026-06-25T01:00:00Z',
      group: 'L',
      stadium: 'Mercedes-Benz Stadium, Atlanta',
    },
    {
      homeTeam: 'Croatia',
      awayTeam: 'Panama',
      datetime: '2026-06-25T19:00:00Z',
      group: 'L',
      stadium: 'BMO Field, Toronto',
    },
    {
      homeTeam: 'Croatia',
      awayTeam: 'England',
      datetime: '2026-06-29T22:00:00Z',
      group: 'L',
      stadium: 'MetLife Stadium, New Jersey',
    },
    {
      homeTeam: 'Panama',
      awayTeam: 'Ghana',
      datetime: '2026-06-29T22:00:00Z',
      group: 'L',
      stadium: 'AT&T Stadium, Dallas',
    },
  ];

  for (const match of groupMatches) {
    await prisma.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: teamMap[match.homeTeam],
        awayTeamId: teamMap[match.awayTeam],
        matchDatetime: new Date(match.datetime),
        stadium: match.stadium,
        stage: MatchStage.GROUP,
        matchStatus: MatchStatus.SCHEDULED,
        group: match.group,
      },
    });
    console.log(`Created group match: ${match.homeTeam} vs ${match.awayTeam}`);
  }
}
