import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// All times are in America/São_Paulo (BRT = UTC-3, no DST in June–July).
// ISO-8601 strings with -03:00 offset so new Date() produces the correct UTC.
// ---------------------------------------------------------------------------

interface GroupFix {
  home: string;
  away: string;
  dt: string;
}

const GROUP_FIXES: GroupFix[] = [
  // ── Rodada 1 ────────────────────────────────────────────────────────────
  { home: 'México',                          away: 'África do Sul',                  dt: '2026-06-11T16:00:00-03:00' },
  { home: 'Coreia do Sul',                   away: 'Tchéquia',                       dt: '2026-06-11T23:00:00-03:00' },
  { home: 'Canadá',                          away: 'Bósnia e Herzegovina',           dt: '2026-06-12T16:00:00-03:00' },
  { home: 'Estados Unidos',                  away: 'Paraguai',                       dt: '2026-06-12T22:00:00-03:00' },
  { home: 'Catar',                           away: 'Suíça',                          dt: '2026-06-13T16:00:00-03:00' },
  { home: 'Brasil',                          away: 'Marrocos',                       dt: '2026-06-13T19:00:00-03:00' },
  { home: 'Haiti',                           away: 'Escócia',                        dt: '2026-06-13T22:00:00-03:00' },
  { home: 'Austrália',                       away: 'Turquia',                        dt: '2026-06-14T01:00:00-03:00' },
  { home: 'Alemanha',                        away: 'Curaçao',                        dt: '2026-06-14T14:00:00-03:00' },
  { home: 'Holanda',                         away: 'Japão',                          dt: '2026-06-14T17:00:00-03:00' },
  { home: 'Costa do Marfim',                 away: 'Equador',                        dt: '2026-06-14T20:00:00-03:00' },
  { home: 'Suécia',                          away: 'Tunísia',                        dt: '2026-06-14T23:00:00-03:00' },
  { home: 'Espanha',                         away: 'Cabo Verde',                     dt: '2026-06-15T13:00:00-03:00' },
  { home: 'Bélgica',                         away: 'Egito',                          dt: '2026-06-15T16:00:00-03:00' },
  { home: 'Arábia Saudita',                  away: 'Uruguai',                        dt: '2026-06-15T19:00:00-03:00' },
  { home: 'Irã',                             away: 'Nova Zelândia',                  dt: '2026-06-15T22:00:00-03:00' },
  { home: 'França',                          away: 'Senegal',                        dt: '2026-06-16T16:00:00-03:00' },
  { home: 'Iraque',                          away: 'Noruega',                        dt: '2026-06-16T19:00:00-03:00' },
  { home: 'Argentina',                       away: 'Argélia',                        dt: '2026-06-16T22:00:00-03:00' },
  { home: 'Áustria',                         away: 'Jordânia',                       dt: '2026-06-17T01:00:00-03:00' },
  { home: 'Portugal',                        away: 'República Democrática do Congo', dt: '2026-06-17T14:00:00-03:00' },
  { home: 'Inglaterra',                      away: 'Croácia',                        dt: '2026-06-17T17:00:00-03:00' },
  { home: 'Gana',                            away: 'Panamá',                         dt: '2026-06-17T20:00:00-03:00' },
  { home: 'Uzbequistão',                     away: 'Colômbia',                       dt: '2026-06-17T23:00:00-03:00' },
  // ── Rodada 2 ────────────────────────────────────────────────────────────
  { home: 'Tchéquia',                        away: 'África do Sul',                  dt: '2026-06-18T13:00:00-03:00' },
  { home: 'Suíça',                           away: 'Bósnia e Herzegovina',           dt: '2026-06-18T16:00:00-03:00' },
  { home: 'Canadá',                          away: 'Catar',                          dt: '2026-06-18T19:00:00-03:00' },
  { home: 'México',                          away: 'Coreia do Sul',                  dt: '2026-06-18T22:00:00-03:00' },
  { home: 'Estados Unidos',                  away: 'Austrália',                      dt: '2026-06-19T16:00:00-03:00' },
  { home: 'Escócia',                         away: 'Marrocos',                       dt: '2026-06-19T19:00:00-03:00' },
  { home: 'Brasil',                          away: 'Haiti',                          dt: '2026-06-19T21:30:00-03:00' },
  { home: 'Turquia',                         away: 'Paraguai',                       dt: '2026-06-20T01:00:00-03:00' },
  { home: 'Holanda',                         away: 'Suécia',                         dt: '2026-06-20T14:00:00-03:00' },
  { home: 'Alemanha',                        away: 'Costa do Marfim',                dt: '2026-06-20T17:00:00-03:00' },
  { home: 'Equador',                         away: 'Curaçao',                        dt: '2026-06-20T21:00:00-03:00' },
  { home: 'Tunísia',                         away: 'Japão',                          dt: '2026-06-21T01:00:00-03:00' },
  { home: 'Espanha',                         away: 'Arábia Saudita',                 dt: '2026-06-21T13:00:00-03:00' },
  { home: 'Bélgica',                         away: 'Irã',                            dt: '2026-06-21T16:00:00-03:00' },
  { home: 'Uruguai',                         away: 'Cabo Verde',                     dt: '2026-06-21T19:00:00-03:00' },
  { home: 'Nova Zelândia',                   away: 'Egito',                          dt: '2026-06-21T22:00:00-03:00' },
  { home: 'Argentina',                       away: 'Áustria',                        dt: '2026-06-22T14:00:00-03:00' },
  { home: 'França',                          away: 'Iraque',                         dt: '2026-06-22T18:00:00-03:00' },
  { home: 'Noruega',                         away: 'Senegal',                        dt: '2026-06-22T21:00:00-03:00' },
  { home: 'Jordânia',                        away: 'Argélia',                        dt: '2026-06-23T00:00:00-03:00' },
  { home: 'Portugal',                        away: 'Uzbequistão',                    dt: '2026-06-23T14:00:00-03:00' },
  { home: 'Inglaterra',                      away: 'Gana',                           dt: '2026-06-23T17:00:00-03:00' },
  { home: 'Panamá',                          away: 'Croácia',                        dt: '2026-06-23T20:00:00-03:00' },
  { home: 'Colômbia',                        away: 'República Democrática do Congo', dt: '2026-06-23T23:00:00-03:00' },
  // ── Rodada 3 ────────────────────────────────────────────────────────────
  { home: 'Suíça',                           away: 'Canadá',                         dt: '2026-06-24T16:00:00-03:00' },
  { home: 'Bósnia e Herzegovina',            away: 'Catar',                          dt: '2026-06-24T16:00:00-03:00' },
  { home: 'Marrocos',                        away: 'Haiti',                          dt: '2026-06-24T19:00:00-03:00' },
  { home: 'Escócia',                         away: 'Brasil',                         dt: '2026-06-24T19:00:00-03:00' },
  { home: 'África do Sul',                   away: 'Coreia do Sul',                  dt: '2026-06-24T22:00:00-03:00' },
  { home: 'Tchéquia',                        away: 'México',                         dt: '2026-06-24T22:00:00-03:00' },
  { home: 'Equador',                         away: 'Alemanha',                       dt: '2026-06-25T17:00:00-03:00' },
  { home: 'Curaçao',                         away: 'Costa do Marfim',                dt: '2026-06-25T17:00:00-03:00' },
  { home: 'Tunísia',                         away: 'Holanda',                        dt: '2026-06-25T20:00:00-03:00' },
  { home: 'Japão',                           away: 'Suécia',                         dt: '2026-06-25T20:00:00-03:00' },
  { home: 'Turquia',                         away: 'Estados Unidos',                 dt: '2026-06-25T23:00:00-03:00' },
  { home: 'Paraguai',                        away: 'Austrália',                      dt: '2026-06-25T23:00:00-03:00' },
  { home: 'Senegal',                         away: 'Iraque',                         dt: '2026-06-26T16:00:00-03:00' },
  { home: 'Noruega',                         away: 'França',                         dt: '2026-06-26T16:00:00-03:00' },
  { home: 'Cabo Verde',                      away: 'Arábia Saudita',                 dt: '2026-06-26T21:00:00-03:00' },
  { home: 'Uruguai',                         away: 'Espanha',                        dt: '2026-06-26T21:00:00-03:00' },
  { home: 'Egito',                           away: 'Irã',                            dt: '2026-06-27T00:00:00-03:00' },
  { home: 'Nova Zelândia',                   away: 'Bélgica',                        dt: '2026-06-27T00:00:00-03:00' },
  { home: 'Croácia',                         away: 'Gana',                           dt: '2026-06-27T18:00:00-03:00' },
  { home: 'Panamá',                          away: 'Inglaterra',                     dt: '2026-06-27T18:00:00-03:00' },
  { home: 'República Democrática do Congo',  away: 'Uzbequistão',                   dt: '2026-06-27T20:30:00-03:00' },
  { home: 'Colômbia',                        away: 'Portugal',                       dt: '2026-06-27T20:30:00-03:00' },
  { home: 'Jordânia',                        away: 'Argentina',                      dt: '2026-06-27T23:00:00-03:00' },
  { home: 'Argélia',                         away: 'Áustria',                        dt: '2026-06-27T23:00:00-03:00' },
];

// ---------------------------------------------------------------------------
// Knockout stage datetimes in BRT (America/São_Paulo, -03:00)
// ---------------------------------------------------------------------------

const R32_DATETIMES = [
  '2026-06-28T16:00:00-03:00',
  '2026-06-29T14:00:00-03:00',
  '2026-06-29T17:30:00-03:00',
  '2026-06-29T22:00:00-03:00',
  '2026-06-30T14:00:00-03:00',
  '2026-06-30T18:00:00-03:00',
  '2026-06-30T22:00:00-03:00',
  '2026-07-01T13:00:00-03:00',
  '2026-07-01T17:00:00-03:00',
  '2026-07-01T21:00:00-03:00',
  '2026-07-02T16:00:00-03:00',
  '2026-07-02T20:00:00-03:00',
  '2026-07-03T00:00:00-03:00',
  '2026-07-03T15:00:00-03:00',
  '2026-07-03T19:00:00-03:00',
  '2026-07-03T22:30:00-03:00',
];

const R16_DATETIMES = [
  '2026-07-04T14:00:00-03:00',
  '2026-07-04T18:00:00-03:00',
  '2026-07-05T17:00:00-03:00',
  '2026-07-05T21:00:00-03:00',
  '2026-07-06T16:00:00-03:00',
  '2026-07-06T21:00:00-03:00',
  '2026-07-07T13:00:00-03:00',
  '2026-07-07T17:00:00-03:00',
];

const QF_DATETIMES = [
  '2026-07-09T17:00:00-03:00',
  '2026-07-10T16:00:00-03:00',
  '2026-07-11T18:00:00-03:00',
  '2026-07-11T22:00:00-03:00',
];

const SF_DATETIMES = [
  '2026-07-14T16:00:00-03:00',
  '2026-07-15T16:00:00-03:00',
];

const THIRD_PLACE_DATETIMES = ['2026-07-18T18:00:00-03:00'];
const FINAL_DATETIMES        = ['2026-07-19T16:00:00-03:00'];

// ---------------------------------------------------------------------------

async function fixKnockoutStage(
  stage: MatchStage,
  correctDatetimes: string[],
  tournamentId: number,
  tbdTeamId: number
) {
  let matches = await prisma.match.findMany({
    where: { tournamentId, stage },
    orderBy: { matchDatetime: 'asc' },
  });

  if (matches.length < correctDatetimes.length) {
    const missing = correctDatetimes.length - matches.length;
    console.log(`  ⚠ ${stage}: found ${matches.length}, expected ${correctDatetimes.length} — creating ${missing} shell(s)`);
    for (let i = matches.length; i < correctDatetimes.length; i++) {
      await prisma.match.create({
        data: {
          tournamentId,
          homeTeamId: tbdTeamId,
          awayTeamId: tbdTeamId,
          matchDatetime: new Date(correctDatetimes[i]),
          stage,
          matchStatus: MatchStatus.SCHEDULED,
        },
      });
    }
    matches = await prisma.match.findMany({
      where: { tournamentId, stage },
      orderBy: { matchDatetime: 'asc' },
    });
  }

  for (let i = 0; i < correctDatetimes.length; i++) {
    await prisma.match.update({
      where: { id: matches[i].id },
      data: { matchDatetime: new Date(correctDatetimes[i]) },
    });
  }
  console.log(`  ✓ ${stage}: ${correctDatetimes.length} match(es) updated`);
}

async function main() {
  console.log('=== fixMatchDatetimes2026 ===\n');

  const tournament = await prisma.tournament.findFirstOrThrow({
    where: { name: { contains: '2026' } },
  });
  console.log(`Tournament: "${tournament.name}" (id=${tournament.id})\n`);

  const teams = await prisma.team.findMany();
  const teamMap: Record<string, number> = {};
  for (const t of teams) teamMap[t.name] = t.id;

  const tbdTeam = await prisma.team.findFirstOrThrow({ where: { name: 'TBD Knockout' } });

  // ── Group matches ────────────────────────────────────────────────────────
  console.log('Fixing group matches...');
  let groupUpdated = 0;
  for (const fix of GROUP_FIXES) {
    const homeId = teamMap[fix.home];
    const awayId = teamMap[fix.away];
    if (!homeId || !awayId) {
      console.warn(`  ⚠ Team not found: "${fix.home}" or "${fix.away}" — skipping`);
      continue;
    }
    const result = await prisma.match.updateMany({
      where: { tournamentId: tournament.id, homeTeamId: homeId, awayTeamId: awayId },
      data: { matchDatetime: new Date(fix.dt) },
    });
    if (result.count === 0) {
      console.warn(`  ⚠ Match not found: ${fix.home} vs ${fix.away}`);
    }
    groupUpdated += result.count;
  }
  console.log(`  ✓ ${groupUpdated} group match row(s) updated\n`);

  // ── Knockout matches ─────────────────────────────────────────────────────
  console.log('Fixing knockout matches...');
  await fixKnockoutStage(MatchStage.ROUND_OF_32,   R32_DATETIMES,         tournament.id, tbdTeam.id);
  await fixKnockoutStage(MatchStage.ROUND_OF_16,   R16_DATETIMES,         tournament.id, tbdTeam.id);
  await fixKnockoutStage(MatchStage.QUARTER_FINAL, QF_DATETIMES,          tournament.id, tbdTeam.id);
  await fixKnockoutStage(MatchStage.SEMI_FINAL,    SF_DATETIMES,          tournament.id, tbdTeam.id);
  await fixKnockoutStage(MatchStage.THIRD_PLACE,   THIRD_PLACE_DATETIMES, tournament.id, tbdTeam.id);
  await fixKnockoutStage(MatchStage.FINAL,         FINAL_DATETIMES,       tournament.id, tbdTeam.id);

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
