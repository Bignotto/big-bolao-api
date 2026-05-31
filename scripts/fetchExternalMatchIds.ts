import * as fs from 'fs';
import * as path from 'path';

import { PrismaClient, MatchStage } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DbMatch {
  id: number;
  matchDatetime: Date;
  homeTeam: { name: string; countryCode: string | null };
  awayTeam: { name: string; countryCode: string | null };
}

interface FdOrgFixture {
  id: number;
  homeCode: string | null;
  awayCode: string | null;
  homeName: string;
  awayName: string;
  utcDate: string;
}

interface ApiFutebolFixture {
  id: number;
  homeCode: string | null;
  awayCode: string | null;
  homeName: string;
  awayName: string;
  date: string; // ISO date string, converted from DD/MM/YYYY HH:MM
}

interface MappingEntry {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDatetime: string;
  apiFutebolId: number | null;
  footballDataOrgId: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// FIFA 3-letter codes → ISO 3166-1 alpha-3. football-data.org uses FIFA codes;
// our DB uses ISO codes. Extend this map whenever a new mismatch is found.
const FIFA_TO_ISO: Record<string, string> = {
  AFG: 'AFG', ALB: 'ALB', ALG: 'DZA', AND: 'AND', ANG: 'AGO', ARG: 'ARG',
  ARM: 'ARM', AUS: 'AUS', AUT: 'AUT', AZE: 'AZE', BAH: 'BHS', BAN: 'BGD',
  BEL: 'BEL', BEN: 'BEN', BER: 'BMU', BIH: 'BIH', BOL: 'BOL', BOT: 'BWA',
  BRA: 'BRA', BUL: 'BGR', BUR: 'BFA', CAM: 'KHM', CAN: 'CAN', CGO: 'COG',
  CHI: 'CHL', CHN: 'CHN', CIV: 'CIV', CMR: 'CMR', COD: 'COD', COL: 'COL',
  COM: 'COM', CPV: 'CPV', CRC: 'CRI', CRO: 'HRV', CUB: 'CUB', CUR: 'CUW',
  CYP: 'CYP', CZE: 'CZE', DEN: 'DNK', DJI: 'DJI', DOM: 'DOM', ECU: 'ECU',
  EGY: 'EGY', ENG: 'ENG', EQG: 'GNQ', ESP: 'ESP', EST: 'EST', ETH: 'ETH',
  FIN: 'FIN', FIJ: 'FJI', FRA: 'FRA', GAB: 'GAB', GAM: 'GMB', GEO: 'GEO',
  GER: 'DEU', GHA: 'GHA', GNB: 'GNB', GRE: 'GRC', GUA: 'GTM', GUI: 'GIN',
  HAI: 'HTI', HON: 'HND', HUN: 'HUN', IDN: 'IDN', IND: 'IND', IRL: 'IRL',
  IRN: 'IRN', IRQ: 'IRQ', ISL: 'ISL', ISR: 'ISR', ITA: 'ITA', JAM: 'JAM',
  JOR: 'JOR', JPN: 'JPN', KAZ: 'KAZ', KEN: 'KEN', KGZ: 'KGZ', KOR: 'KOR',
  KSA: 'SAU', KUW: 'KWT', LAO: 'LAO', LBA: 'LBY', LBN: 'LBN', LBR: 'LBR',
  LIE: 'LIE', LTU: 'LTU', LUX: 'LUX', MAD: 'MDG', MAR: 'MAR', MDA: 'MDA',
  MEX: 'MEX', MKD: 'MKD', MLI: 'MLI', MLT: 'MLT', MNE: 'MNE', MOZ: 'MOZ',
  MRI: 'MUS', MTN: 'MRT', MWI: 'MWI', MYA: 'MMR', NAM: 'NAM', NCA: 'NIC',
  NED: 'NLD', NEP: 'NPL', NGA: 'NGA', NIR: 'NIR', NOR: 'NOR', NZL: 'NZL',
  OMA: 'OMN', PAK: 'PAK', PAN: 'PAN', PAR: 'PRY', PER: 'PER', PHI: 'PHL',
  PNG: 'PNG', POL: 'POL', POR: 'PRT', PRK: 'PRK', PUR: 'PRI', QAT: 'QAT',
  ROU: 'ROU', RSA: 'ZAF', RUS: 'RUS', RWA: 'RWA', SCO: 'SCO', SDN: 'SDN',
  SEN: 'SEN', SGP: 'SGP', SIN: 'SGP', SKN: 'KNA', SLE: 'SLE', SLO: 'SVN',
  SMR: 'SMR', SOL: 'SLB', SOM: 'SOM', SRB: 'SRB', SRI: 'LKA', SSD: 'SSD',
  SUI: 'CHE', SUR: 'SUR', SVK: 'SVK', SWE: 'SWE', SWZ: 'SWZ', SYR: 'SYR',
  TAN: 'TZA', TGA: 'TON', THA: 'THA', TJK: 'TJK', TKM: 'TKM', TOG: 'TGO',
  TRI: 'TTO', TUN: 'TUN', TUR: 'TUR', UAE: 'ARE', UGA: 'UGA', UKR: 'UKR',
  URU: 'URY', USA: 'USA', UZB: 'UZB', VEN: 'VEN', VIE: 'VNM', WAL: 'WAL',
  YEM: 'YEM', ZAM: 'ZMB', ZIM: 'ZWE',
};

function toUtcDay(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function normalizeCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}

function toIso(code: string | null | undefined): string {
  const upper = normalizeCode(code);
  return FIFA_TO_ISO[upper] ?? upper;
}

interface Fixture {
  homeCode: string | null;
  awayCode: string | null;
  date?: string;
  utcDate?: string;
}

function dayDiff(a: string, b: string): number {
  return Math.abs(
    (new Date(a).setUTCHours(0, 0, 0, 0) - new Date(b).setUTCHours(0, 0, 0, 0)) /
      86_400_000,
  );
}

function findMatch<T extends Fixture>(
  dbMatch: DbMatch,
  fixtures: T[],
  dateKey: 'date' | 'utcDate',
): T | null {
  const dbDay = toUtcDay(dbMatch.matchDatetime.toISOString());
  const dbHome = normalizeCode(dbMatch.homeTeam.countryCode);
  const dbAway = normalizeCode(dbMatch.awayTeam.countryCode);

  const nearDay = (f: T) => dayDiff(f[dateKey] as string, dbDay) <= 1;
  const codesMatch = (f: T, translate: boolean) => {
    if (!f.homeCode || !f.awayCode) return false;
    const fHome = translate ? toIso(f.homeCode) : normalizeCode(f.homeCode);
    const fAway = translate ? toIso(f.awayCode) : normalizeCode(f.awayCode);
    return fHome === dbHome && fAway === dbAway;
  };

  // Pass 1: exact code match within ±1 day
  if (dbHome && dbAway) {
    const p1 = fixtures.find((f) => nearDay(f) && codesMatch(f, false));
    if (p1) return p1;
  }

  // Pass 2: FIFA→ISO translated code match within ±1 day
  if (dbHome && dbAway) {
    const p2 = fixtures.find((f) => nearDay(f) && codesMatch(f, true));
    if (p2) return p2;
  }

  // Pass 3: sole fixture within ±1 day
  const nearby = fixtures.filter(nearDay);
  if (nearby.length === 1) return nearby[0];

  return null;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchFootballDataOrg(): Promise<FdOrgFixture[]> {
  const token = process.env.FOOTBALL_DATA_ORG_TOKEN;
  if (!token) throw new Error('FOOTBALL_DATA_ORG_TOKEN is not set in .env');

  const res = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    { headers: { 'X-Auth-Token': token } },
  );
  if (!res.ok) throw new Error(`football-data.org: ${res.status} ${res.statusText}`);

  const body = await res.json() as {
    matches: Array<{
      id: number;
      homeTeam: { name: string; tla: string | null };
      awayTeam: { name: string; tla: string | null };
      utcDate: string;
    }>;
  };

  return body.matches.map((m) => ({
    id: m.id,
    homeCode: m.homeTeam.tla,
    awayCode: m.awayTeam.tla,
    homeName: m.homeTeam.name,
    awayName: m.awayTeam.name,
    utcDate: m.utcDate,
  }));
}

// Converts API-Futebol's "DD/MM/YYYY" + "HH:MM" into an ISO datetime string.
function apiFutebolDateToIso(date: string, time: string): string {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}T${time}:00.000Z`;
}

async function fetchApiFutebol(): Promise<ApiFutebolFixture[]> {
  const key = process.env.API_FUTEBOL_KEY;
  if (!key) throw new Error('API_FUTEBOL_KEY is not set in .env');

  const championshipId = process.env.API_FUTEBOL_CHAMPIONSHIP_ID;
  if (!championshipId) throw new Error('API_FUTEBOL_CHAMPIONSHIP_ID is not set in .env');

  const res = await fetch(
    `https://api.api-futebol.com.br/v1/campeonatos/${championshipId}/partidas`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`api-futebol: ${res.status} ${res.statusText}`);

  const body = await res.json() as Array<{
    partida_id: number;
    data_realizacao: string;
    hora_realizacao: string;
    mandante: { nome_popular: string; sigla: string };
    visitante: { nome_popular: string; sigla: string };
  }>;

  return body.map((m) => ({
    id: m.partida_id,
    homeCode: m.mandante.sigla,
    awayCode: m.visitante.sigla,
    homeName: m.mandante.nome_popular,
    awayName: m.visitante.nome_popular,
    date: apiFutebolDateToIso(m.data_realizacao, m.hora_realizacao),
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Fetching matches from database...');
  const tournament = await prisma.tournament.findFirst({
    where: { name: 'FIFA World Cup 2026' },
  });
  if (!tournament) throw new Error('Tournament "FIFA World Cup 2026" not found in database');

  const dbMatches: DbMatch[] = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      stage: MatchStage.GROUP,
    },
    select: {
      id: true,
      matchDatetime: true,
      homeTeam: { select: { name: true, countryCode: true } },
      awayTeam: { select: { name: true, countryCode: true } },
    },
    orderBy: { matchDatetime: 'asc' },
  });

  console.log(`  Found ${dbMatches.length} GROUP stage matches`);

  console.log('Fetching from football-data.org...');
  let fdOrgFixtures: FdOrgFixture[] = [];
  try {
    fdOrgFixtures = await fetchFootballDataOrg();
    console.log(`  Got ${fdOrgFixtures.length} fixtures`);
  } catch (e) {
    console.error(`  ERROR: ${(e as Error).message}`);
  }

  console.log('Fetching from api-futebol...');
  let apiFutebolFixtures: ApiFutebolFixture[] = [];
  try {
    apiFutebolFixtures = await fetchApiFutebol();
    console.log(`  Got ${apiFutebolFixtures.length} fixtures`);
  } catch (e) {
    console.error(`  ERROR: ${(e as Error).message}`);
  }

  // ---------------------------------------------------------------------------
  // Save API country code lists for comparison
  // ---------------------------------------------------------------------------

  const outputDir = path.resolve(process.cwd(), 'scripts/output');
  fs.mkdirSync(outputDir, { recursive: true });

  const toTeamSet = (entries: Array<{ homeCode: string | null; awayCode: string | null; homeName: string; awayName: string }>) => {
    const map = new Map<string, string>();
    for (const e of entries) {
      if (e.homeCode) map.set(e.homeCode.toUpperCase(), e.homeName);
      if (e.awayCode) map.set(e.awayCode.toUpperCase(), e.awayName);
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  const codeReport = {
    footballDataOrg: toTeamSet(fdOrgFixtures),
    apiFutebol: toTeamSet(apiFutebolFixtures),
  };

  const codeReportPath = path.join(outputDir, 'api-country-codes.json');
  fs.writeFileSync(codeReportPath, JSON.stringify(codeReport, null, 2));
  console.log(`\nWrote ${codeReportPath}`);

  // ---------------------------------------------------------------------------
  // Match each DB record to external fixtures
  // ---------------------------------------------------------------------------

  const mapping: MappingEntry[] = [];
  let matchedApiFutebol = 0;
  let matchedFdOrg = 0;
  const unmatched: string[] = [];

  for (const dbMatch of dbMatches) {
    const apiFutebolMatch = apiFutebolFixtures.length
      ? findMatch(dbMatch, apiFutebolFixtures, 'date')
      : null;

    const fdOrgMatch = fdOrgFixtures.length
      ? findMatch(dbMatch, fdOrgFixtures, 'utcDate')
      : null;

    if (apiFutebolMatch) matchedApiFutebol++;
    if (fdOrgMatch) matchedFdOrg++;
    if (!apiFutebolMatch && !fdOrgMatch) {
      const home = `${dbMatch.homeTeam.name} (${dbMatch.homeTeam.countryCode ?? '?'})`;
      const away = `${dbMatch.awayTeam.name} (${dbMatch.awayTeam.countryCode ?? '?'})`;
      const dbDay = toUtcDay(dbMatch.matchDatetime.toISOString());
      const dbHome = normalizeCode(dbMatch.homeTeam.countryCode);
      const dbAway = normalizeCode(dbMatch.awayTeam.countryCode);

      const fdCandidates = fdOrgFixtures
        .filter((f) => toUtcDay(f.utcDate) === dbDay)
        .map((f) => `codes(raw)=${f.homeCode ?? 'null'} vs ${f.awayCode ?? 'null'}  (iso)=${toIso(f.homeCode)} vs ${toIso(f.awayCode)}`);

      const fdNearest = fdOrgFixtures
        .filter((f) => toIso(f.homeCode) === dbHome && toIso(f.awayCode) === dbAway)
        .map((f) => `${f.utcDate} (fd.org id=${f.id})`);

      console.warn(`\n  UNMATCHED: ${home} vs ${away}`);
      console.warn(`    DB  id=${dbMatch.id}  datetime=${dbMatch.matchDatetime.toISOString()}  day(UTC)=${dbDay}  codes(iso)=${dbHome} vs ${dbAway}`);
      if (fdCandidates.length) {
        console.warn(`    fd.org fixtures on same day:`);
        fdCandidates.forEach((c) => console.warn(`      ${c}`));
      } else {
        console.warn(`    fd.org: no fixtures on ${dbDay}`);
      }
      if (fdNearest.length) {
        console.warn(`    fd.org same-code match on different day: ${fdNearest.join(', ')}`);
      }

      unmatched.push(`${home} vs ${away}`);
    }

    mapping.push({
      matchId: dbMatch.id,
      homeTeam: dbMatch.homeTeam.name,
      awayTeam: dbMatch.awayTeam.name,
      matchDatetime: dbMatch.matchDatetime.toISOString(),
      apiFutebolId: apiFutebolMatch?.id ?? null,
      footballDataOrgId: fdOrgMatch?.id ?? null,
    });
  }

  // ---------------------------------------------------------------------------
  // Merge with existing mapping (preserve IDs from previous runs)
  // ---------------------------------------------------------------------------

  const jsonPath = path.join(outputDir, 'match-id-mapping.json');

  if (fs.existsSync(jsonPath)) {
    const existing: MappingEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const existingById = new Map(existing.map((e) => [e.matchId, e]));
    for (const entry of mapping) {
      const prev = existingById.get(entry.matchId);
      if (prev) {
        if (entry.apiFutebolId === null) entry.apiFutebolId = prev.apiFutebolId ?? null;
        if (entry.footballDataOrgId === null) entry.footballDataOrgId = prev.footballDataOrgId;
      }
    }
    console.log('\nMerged with existing match-id-mapping.json');
  }

  fs.writeFileSync(jsonPath, JSON.stringify(mapping, null, 2));
  console.log(`Wrote ${jsonPath}`);

  const sqlLines: string[] = [];
  for (const entry of mapping) {
    if (entry.apiFutebolId === null && entry.footballDataOrgId === null) continue;

    const setClauses: string[] = [];
    if (entry.apiFutebolId !== null) setClauses.push(`"apiFutebolId" = ${entry.apiFutebolId}`);
    if (entry.footballDataOrgId !== null) setClauses.push(`"footballDataOrgId" = ${entry.footballDataOrgId}`);

    sqlLines.push(`UPDATE matches SET ${setClauses.join(', ')} WHERE id = ${entry.matchId};`);
  }

  const sqlPath = path.join(outputDir, 'update-external-ids.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n') + (sqlLines.length ? '\n' : ''));
  console.log(`Wrote ${sqlPath}`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log('\n=== Summary ===');
  console.log(`Total matches in DB:       ${dbMatches.length}`);
  console.log(`Matched to api-futebol:    ${matchedApiFutebol}/${dbMatches.length}`);
  console.log(`Matched to fd.org:         ${matchedFdOrg}/${dbMatches.length}`);
  if (unmatched.length) {
    console.log(`\nUnmatched (neither API):`);
    unmatched.forEach((u) => console.log(`  - ${u}`));
  } else {
    console.log('All matches were matched to at least one external API.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
