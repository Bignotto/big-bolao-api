import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Placeholder team name used for knockout TBD slots
const TBD = 'TBD Knockout';

interface KnockoutShell {
  label: string;
  datetime: string;
  stage: MatchStage;
  stadium: string;
}

export async function createKnockoutMatches2026(
  tournamentId: number,
  teamMap: { [key: string]: number }
) {
  // Knockout teams are not known yet — all slots use a TBD placeholder.
  // A "TBD Knockout" team entry must exist in the DB (created by seedTeams2026).
  // ⚠️ Match times are approximate based on the published 2026 schedule.

  const knockoutShells: KnockoutShell[] = [
    // ── ROUND OF 32 (June 28 – July 3, 2026) ─────────────────────────────
    { label: 'R32 Match 1',  datetime: '2026-06-28T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'MetLife Stadium, New Jersey' },
    { label: 'R32 Match 2',  datetime: '2026-06-28T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'AT&T Stadium, Dallas' },
    { label: 'R32 Match 3',  datetime: '2026-06-29T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'SoFi Stadium, Los Angeles' },
    { label: 'R32 Match 4',  datetime: '2026-06-29T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Hard Rock Stadium, Miami' },
    { label: 'R32 Match 5',  datetime: '2026-06-30T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Mercedes-Benz Stadium, Atlanta' },
    { label: 'R32 Match 6',  datetime: '2026-06-30T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Estadio Azteca, Mexico City' },
    { label: 'R32 Match 7',  datetime: '2026-07-01T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Gillette Stadium, Boston' },
    { label: 'R32 Match 8',  datetime: '2026-07-01T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Levi\'s Stadium, San Francisco' },
    { label: 'R32 Match 9',  datetime: '2026-07-02T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Arrowhead Stadium, Kansas City' },
    { label: 'R32 Match 10', datetime: '2026-07-02T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Lincoln Financial Field, Philadelphia' },
    { label: 'R32 Match 11', datetime: '2026-07-02T22:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'BC Place, Vancouver' },
    { label: 'R32 Match 12', datetime: '2026-07-03T01:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'NRG Stadium, Houston' },
    { label: 'R32 Match 13', datetime: '2026-07-03T19:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'BMO Field, Toronto' },
    { label: 'R32 Match 14', datetime: '2026-07-03T22:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Lumen Field, Seattle' },
    { label: 'R32 Match 15', datetime: '2026-07-03T22:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Estadio Guadalajara, Guadalajara' },
    { label: 'R32 Match 16', datetime: '2026-07-03T22:00:00Z', stage: MatchStage.ROUND_OF_32, stadium: 'Estadio Monterrey, Monterrey' },

    // ── ROUND OF 16 (July 4–7, 2026) ─────────────────────────────────────
    { label: 'R16 Match 1', datetime: '2026-07-04T19:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'MetLife Stadium, New Jersey' },
    { label: 'R16 Match 2', datetime: '2026-07-04T22:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'AT&T Stadium, Dallas' },
    { label: 'R16 Match 3', datetime: '2026-07-05T19:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'SoFi Stadium, Los Angeles' },
    { label: 'R16 Match 4', datetime: '2026-07-05T22:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'Hard Rock Stadium, Miami' },
    { label: 'R16 Match 5', datetime: '2026-07-06T19:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'Mercedes-Benz Stadium, Atlanta' },
    { label: 'R16 Match 6', datetime: '2026-07-06T22:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'Estadio Azteca, Mexico City' },
    { label: 'R16 Match 7', datetime: '2026-07-07T19:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'Levi\'s Stadium, San Francisco' },
    { label: 'R16 Match 8', datetime: '2026-07-07T22:00:00Z', stage: MatchStage.ROUND_OF_16, stadium: 'Arrowhead Stadium, Kansas City' },

    // ── QUARTER-FINALS (July 9–11, 2026) ──────────────────────────────────
    { label: 'QF Match 1', datetime: '2026-07-09T19:00:00Z', stage: MatchStage.QUARTER_FINAL, stadium: 'MetLife Stadium, New Jersey' },
    { label: 'QF Match 2', datetime: '2026-07-09T22:00:00Z', stage: MatchStage.QUARTER_FINAL, stadium: 'SoFi Stadium, Los Angeles' },
    { label: 'QF Match 3', datetime: '2026-07-10T19:00:00Z', stage: MatchStage.QUARTER_FINAL, stadium: 'AT&T Stadium, Dallas' },
    { label: 'QF Match 4', datetime: '2026-07-11T19:00:00Z', stage: MatchStage.QUARTER_FINAL, stadium: 'Hard Rock Stadium, Miami' },

    // ── SEMI-FINALS (July 14–15, 2026) ────────────────────────────────────
    { label: 'SF Match 1', datetime: '2026-07-14T22:00:00Z', stage: MatchStage.SEMI_FINAL, stadium: 'MetLife Stadium, New Jersey' },
    { label: 'SF Match 2', datetime: '2026-07-15T22:00:00Z', stage: MatchStage.SEMI_FINAL, stadium: 'AT&T Stadium, Dallas' },

    // ── THIRD PLACE (July 18, 2026) ────────────────────────────────────────
    { label: 'Third Place', datetime: '2026-07-18T22:00:00Z', stage: MatchStage.THIRD_PLACE, stadium: 'Hard Rock Stadium, Miami' },

    // ── FINAL (July 19, 2026) ─────────────────────────────────────────────
    { label: 'Final', datetime: '2026-07-19T22:00:00Z', stage: MatchStage.FINAL, stadium: 'MetLife Stadium, New Jersey' },
  ];

  // Ensure there is a TBD team in the DB to use as placeholder for both slots
  let tbdTeam = await prisma.team.findFirst({ where: { name: TBD } });
  if (!tbdTeam) {
    tbdTeam = await prisma.team.create({
      data: { name: TBD, countryCode: 'TBD', flagUrl: '' },
    });
    console.log(`Created placeholder team: ${TBD}`);
  }

  for (const match of knockoutShells) {
    await prisma.match.create({
      data: {
        tournamentId: tournamentId,
        homeTeamId: tbdTeam.id,
        awayTeamId: tbdTeam.id,
        matchDatetime: new Date(match.datetime),
        stadium: match.stadium,
        stage: match.stage,
        matchStatus: MatchStatus.SCHEDULED,
      },
    });
    console.log(`Created knockout shell: ${match.label} (${match.stage})`);
  }
}
