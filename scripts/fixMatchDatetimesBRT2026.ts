import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface GroupFix {
  home: string;
  away: string;
  dt: string;
}

const GROUP_FIXES: GroupFix[] = [
  // ── Rodada 1 ────────────────────────────────────────────────────────────
  { home: 'México',                          away: 'África do Sul',                  dt: '2026-06-11T16:00:00.000Z' },
  { home: 'Coreia do Sul',                   away: 'Tchéquia',                       dt: '2026-06-11T23:00:00.000Z' },
  { home: 'Canadá',                          away: 'Bósnia e Herzegovina',           dt: '2026-06-12T16:00:00.000Z' },
  { home: 'Estados Unidos',                  away: 'Paraguai',                       dt: '2026-06-12T22:00:00.000Z' },
  { home: 'Catar',                           away: 'Suíça',                          dt: '2026-06-13T16:00:00.000Z' },
  { home: 'Brasil',                          away: 'Marrocos',                       dt: '2026-06-13T19:00:00.000Z' },
  { home: 'Haiti',                           away: 'Escócia',                        dt: '2026-06-13T22:00:00.000Z' },
  { home: 'Austrália',                       away: 'Turquia',                        dt: '2026-06-14T01:00:00.000Z' },
  { home: 'Alemanha',                        away: 'Curaçao',                        dt: '2026-06-14T14:00:00.000Z' },
  { home: 'Holanda',                         away: 'Japão',                          dt: '2026-06-14T17:00:00.000Z' },
  { home: 'Costa do Marfim',                 away: 'Equador',                        dt: '2026-06-14T20:00:00.000Z' },
  { home: 'Suécia',                          away: 'Tunísia',                        dt: '2026-06-14T23:00:00.000Z' },
  { home: 'Espanha',                         away: 'Cabo Verde',                     dt: '2026-06-15T13:00:00.000Z' },
  { home: 'Bélgica',                         away: 'Egito',                          dt: '2026-06-15T16:00:00.000Z' },
  { home: 'Arábia Saudita',                  away: 'Uruguai',                        dt: '2026-06-15T19:00:00.000Z' },
  { home: 'Irã',                             away: 'Nova Zelândia',                  dt: '2026-06-15T22:00:00.000Z' },
  { home: 'França',                          away: 'Senegal',                        dt: '2026-06-16T16:00:00.000Z' },
  { home: 'Iraque',                          away: 'Noruega',                        dt: '2026-06-16T19:00:00.000Z' },
  { home: 'Argentina',                       away: 'Argélia',                        dt: '2026-06-16T22:00:00.000Z' },
  { home: 'Áustria',                         away: 'Jordânia',                       dt: '2026-06-17T01:00:00.000Z' },
  { home: 'Portugal',                        away: 'República Democrática do Congo', dt: '2026-06-17T14:00:00.000Z' },
  { home: 'Inglaterra',                      away: 'Croácia',                        dt: '2026-06-17T17:00:00.000Z' },
  { home: 'Gana',                            away: 'Panamá',                         dt: '2026-06-17T20:00:00.000Z' },
  { home: 'Uzbequistão',                     away: 'Colômbia',                       dt: '2026-06-17T23:00:00.000Z' },
  // ── Rodada 2 ────────────────────────────────────────────────────────────
  { home: 'Tchéquia',                        away: 'África do Sul',                  dt: '2026-06-18T13:00:00.000Z' },
  { home: 'Suíça',                           away: 'Bósnia e Herzegovina',           dt: '2026-06-18T16:00:00.000Z' },
  { home: 'Canadá',                          away: 'Catar',                          dt: '2026-06-18T19:00:00.000Z' },
  { home: 'México',                          away: 'Coreia do Sul',                  dt: '2026-06-18T22:00:00.000Z' },
  { home: 'Estados Unidos',                  away: 'Austrália',                      dt: '2026-06-19T16:00:00.000Z' },
  { home: 'Escócia',                         away: 'Marrocos',                       dt: '2026-06-19T19:00:00.000Z' },
  { home: 'Brasil',                          away: 'Haiti',                          dt: '2026-06-19T21:30:00.000Z' },
  { home: 'Turquia',                         away: 'Paraguai',                       dt: '2026-06-20T01:00:00.000Z' },
  { home: 'Holanda',                         away: 'Suécia',                         dt: '2026-06-20T14:00:00.000Z' },
  { home: 'Alemanha',                        away: 'Costa do Marfim',                dt: '2026-06-20T17:00:00.000Z' },
  { home: 'Equador',                         away: 'Curaçao',                        dt: '2026-06-20T21:00:00.000Z' },
  { home: 'Tunísia',                         away: 'Japão',                          dt: '2026-06-21T01:00:00.000Z' },
  { home: 'Espanha',                         away: 'Arábia Saudita',                 dt: '2026-06-21T13:00:00.000Z' },
  { home: 'Bélgica',                         away: 'Irã',                            dt: '2026-06-21T16:00:00.000Z' },
  { home: 'Uruguai',                         away: 'Cabo Verde',                     dt: '2026-06-21T19:00:00.000Z' },
  { home: 'Nova Zelândia',                   away: 'Egito',                          dt: '2026-06-21T22:00:00.000Z' },
  { home: 'Argentina',                       away: 'Áustria',                        dt: '2026-06-22T14:00:00.000Z' },
  { home: 'França',                          away: 'Iraque',                         dt: '2026-06-22T18:00:00.000Z' },
  { home: 'Noruega',                         away: 'Senegal',                        dt: '2026-06-22T21:00:00.000Z' },
  { home: 'Jordânia',                        away: 'Argélia',                        dt: '2026-06-23T00:00:00.000Z' },
  { home: 'Portugal',                        away: 'Uzbequistão',                    dt: '2026-06-23T14:00:00.000Z' },
  { home: 'Inglaterra',                      away: 'Gana',                           dt: '2026-06-23T17:00:00.000Z' },
  { home: 'Panamá',                          away: 'Croácia',                        dt: '2026-06-23T20:00:00.000Z' },
  { home: 'Colômbia',                        away: 'República Democrática do Congo', dt: '2026-06-23T23:00:00.000Z' },
  // ── Rodada 3 ────────────────────────────────────────────────────────────
  { home: 'Suíça',                           away: 'Canadá',                         dt: '2026-06-24T16:00:00.000Z' },
  { home: 'Bósnia e Herzegovina',            away: 'Catar',                          dt: '2026-06-24T16:00:00.000Z' },
  { home: 'Marrocos',                        away: 'Haiti',                          dt: '2026-06-24T19:00:00.000Z' },
  { home: 'Escócia',                         away: 'Brasil',                         dt: '2026-06-24T19:00:00.000Z' },
  { home: 'África do Sul',                   away: 'Coreia do Sul',                  dt: '2026-06-24T22:00:00.000Z' },
  { home: 'Tchéquia',                        away: 'México',                         dt: '2026-06-24T22:00:00.000Z' },
  { home: 'Equador',                         away: 'Alemanha',                       dt: '2026-06-25T17:00:00.000Z' },
  { home: 'Curaçao',                         away: 'Costa do Marfim',                dt: '2026-06-25T17:00:00.000Z' },
  { home: 'Tunísia',                         away: 'Holanda',                        dt: '2026-06-25T20:00:00.000Z' },
  { home: 'Japão',                           away: 'Suécia',                         dt: '2026-06-25T20:00:00.000Z' },
  { home: 'Turquia',                         away: 'Estados Unidos',                 dt: '2026-06-25T23:00:00.000Z' },
  { home: 'Paraguai',                        away: 'Austrália',                      dt: '2026-06-25T23:00:00.000Z' },
  { home: 'Senegal',                         away: 'Iraque',                         dt: '2026-06-26T16:00:00.000Z' },
  { home: 'Noruega',                         away: 'França',                         dt: '2026-06-26T16:00:00.000Z' },
  { home: 'Cabo Verde',                      away: 'Arábia Saudita',                 dt: '2026-06-26T21:00:00.000Z' },
  { home: 'Uruguai',                         away: 'Espanha',                        dt: '2026-06-26T21:00:00.000Z' },
  { home: 'Egito',                           away: 'Irã',                            dt: '2026-06-27T00:00:00.000Z' },
  { home: 'Nova Zelândia',                   away: 'Bélgica',                        dt: '2026-06-27T00:00:00.000Z' },
  { home: 'Croácia',                         away: 'Gana',                           dt: '2026-06-27T18:00:00.000Z' },
  { home: 'Panamá',                          away: 'Inglaterra',                     dt: '2026-06-27T18:00:00.000Z' },
  { home: 'República Democrática do Congo',  away: 'Uzbequistão',                   dt: '2026-06-27T20:30:00.000Z' },
  { home: 'Colômbia',                        away: 'Portugal',                       dt: '2026-06-27T20:30:00.000Z' },
  { home: 'Jordânia',                        away: 'Argentina',                      dt: '2026-06-27T23:00:00.000Z' },
  { home: 'Argélia',                         away: 'Áustria',                        dt: '2026-06-27T23:00:00.000Z' },
];

const R32_DATETIMES: string[] = [
  '2026-06-28T16:00:00.000Z',
  '2026-06-29T14:00:00.000Z',
  '2026-06-29T17:30:00.000Z',
  '2026-06-29T22:00:00.000Z',
  '2026-06-30T14:00:00.000Z',
  '2026-06-30T18:00:00.000Z',
  '2026-06-30T22:00:00.000Z',
  '2026-07-01T13:00:00.000Z',
  '2026-07-01T17:00:00.000Z',
  '2026-07-01T21:00:00.000Z',
  '2026-07-02T16:00:00.000Z',
  '2026-07-02T20:00:00.000Z',
  '2026-07-03T00:00:00.000Z',
  '2026-07-03T15:00:00.000Z',
  '2026-07-03T19:00:00.000Z',
  '2026-07-03T22:30:00.000Z',
];

const R16_DATETIMES: string[] = [
  '2026-07-04T14:00:00.000Z',
  '2026-07-04T18:00:00.000Z',
  '2026-07-05T17:00:00.000Z',
  '2026-07-05T21:00:00.000Z',
  '2026-07-06T16:00:00.000Z',
  '2026-07-06T21:00:00.000Z',
  '2026-07-07T13:00:00.000Z',
  '2026-07-07T17:00:00.000Z',
];

const QF_DATETIMES: string[] = [
  '2026-07-09T17:00:00.000Z',
  '2026-07-10T16:00:00.000Z',
  '2026-07-11T18:00:00.000Z',
  '2026-07-11T22:00:00.000Z',
];

const SF_DATETIMES: string[]          = ['2026-07-14T16:00:00.000Z', '2026-07-15T16:00:00.000Z'];
const THIRD_PLACE_DATETIMES: string[] = ['2026-07-18T18:00:00.000Z'];
const FINAL_DATETIMES: string[]       = ['2026-07-19T16:00:00.000Z'];

async function fixKnockoutStage(
  stage: MatchStage,
  correctDatetimes: string[],
  tournamentId: number,
  tbdTeamId: number | null
) {
  let matches = await prisma.match.findMany({
    where: { tournamentId, stage },
    orderBy: { matchDatetime: 'asc' },
  });

  if (matches.length < correctDatetimes.length) {
    const missing = correctDatetimes.length - matches.length;
    console.log(`  ⚠ ${stage}: found ${matches.length}, expected ${correctDatetimes.length} — creating ${missing} shell(s)`);

    if (tbdTeamId === null) {
      console.warn(`  ✗ Cannot create missing ${stage} shells: TBD Knockout team not found in DB`);
    } else {
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
  }

  const toUpdate = Math.min(matches.length, correctDatetimes.length);
  for (let i = 0; i < toUpdate; i++) {
    await prisma.match.update({
      where: { id: matches[i].id },
      data: { matchDatetime: new Date(correctDatetimes[i]) },
    });
  }
  console.log(`  ✓ ${stage}: ${toUpdate} match(es) updated`);
}

async function main() {
  console.log('=== fixMatchDatetimesBRT2026 ===\n');

  const tournament = await prisma.tournament.findFirstOrThrow({
    where: { name: { contains: '2026' } },
  });
  console.log(`Tournament: "${tournament.name}" (id=${tournament.id})\n`);

  const teams = await prisma.team.findMany();
  const teamMap: Record<string, number> = {};
  for (const t of teams) teamMap[t.name] = t.id;

  const tbdTeam = await prisma.team.findFirst({ where: { name: 'TBD Knockout' } });
  if (!tbdTeam) {
    console.warn('  ⚠ Team "TBD Knockout" not found — knockout shell creation will be skipped if needed\n');
  }

  console.log('Fixing group matches...');
  let groupUpdated = 0;
  let groupMissed = 0;
  for (const fix of GROUP_FIXES) {
    const homeId = teamMap[fix.home];
    const awayId = teamMap[fix.away];
    if (!homeId || !awayId) {
      console.warn(`  ⚠ Team not found: "${fix.home}" or "${fix.away}" — skipping`);
      groupMissed++;
      continue;
    }
    const result = await prisma.match.updateMany({
      where: { tournamentId: tournament.id, homeTeamId: homeId, awayTeamId: awayId },
      data: { matchDatetime: new Date(fix.dt) },
    });
    if (result.count === 0) {
      console.warn(`  ⚠ Match not found in DB: ${fix.home} vs ${fix.away}`);
      groupMissed++;
    }
    groupUpdated += result.count;
  }
  console.log(`  ✓ ${groupUpdated} group match row(s) updated${groupMissed > 0 ? `, ${groupMissed} skipped` : ''}\n`);

  console.log('Fixing knockout matches...');
  await fixKnockoutStage(MatchStage.ROUND_OF_32,   R32_DATETIMES,         tournament.id, tbdTeam?.id ?? null);
  await fixKnockoutStage(MatchStage.ROUND_OF_16,   R16_DATETIMES,         tournament.id, tbdTeam?.id ?? null);
  await fixKnockoutStage(MatchStage.QUARTER_FINAL, QF_DATETIMES,          tournament.id, tbdTeam?.id ?? null);
  await fixKnockoutStage(MatchStage.SEMI_FINAL,    SF_DATETIMES,          tournament.id, tbdTeam?.id ?? null);
  await fixKnockoutStage(MatchStage.THIRD_PLACE,   THIRD_PLACE_DATETIMES, tournament.id, tbdTeam?.id ?? null);
  await fixKnockoutStage(MatchStage.FINAL,         FINAL_DATETIMES,       tournament.id, tbdTeam?.id ?? null);

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
