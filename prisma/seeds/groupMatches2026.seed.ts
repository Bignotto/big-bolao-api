import { MatchStage, MatchStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  datetime: string; // UTC
  group: string;
  stadium: string;
}

export async function createGroupMatches2026(tournamentId: number, teamMap: { [key: string]: number }) {
  // Calendário oficial da fase de grupos — Copa do Mundo FIFA 2026
  // Horários em UTC (EDT = UTC-4). Nomes dos times em português do Brasil.
  const groupMatches: MatchData[] = [

    // ── GRUPO A: México | Coreia do Sul | África do Sul | Tchéquia ───────────
    { homeTeam: 'México',       awayTeam: 'África do Sul', datetime: '2026-06-11T19:00:00Z', group: 'A', stadium: 'Estadio Azteca, Cidade do México' },
    { homeTeam: 'Coreia do Sul',awayTeam: 'Tchéquia',      datetime: '2026-06-12T02:00:00Z', group: 'A', stadium: 'Estadio Akron, Guadalajara' },
    { homeTeam: 'Tchéquia',     awayTeam: 'África do Sul', datetime: '2026-06-18T16:00:00Z', group: 'A', stadium: 'Mercedes-Benz Stadium, Atlanta' },
    { homeTeam: 'México',       awayTeam: 'Coreia do Sul', datetime: '2026-06-19T01:00:00Z', group: 'A', stadium: 'Estadio Akron, Guadalajara' },
    { homeTeam: 'Tchéquia',     awayTeam: 'México',        datetime: '2026-06-25T01:00:00Z', group: 'A', stadium: 'Estadio Azteca, Cidade do México' },
    { homeTeam: 'África do Sul',awayTeam: 'Coreia do Sul', datetime: '2026-06-25T01:00:00Z', group: 'A', stadium: 'Estadio BBVA, Monterrey' },

    // ── GRUPO B: Canadá | Bósnia e Herzegovina | Catar | Suíça ──────────────
    { homeTeam: 'Canadá',               awayTeam: 'Bósnia e Herzegovina', datetime: '2026-06-12T19:00:00Z', group: 'B', stadium: 'BMO Field, Toronto' },
    { homeTeam: 'Catar',                awayTeam: 'Suíça',                datetime: '2026-06-13T19:00:00Z', group: 'B', stadium: "Levi's Stadium, Santa Clara" },
    { homeTeam: 'Suíça',                awayTeam: 'Bósnia e Herzegovina', datetime: '2026-06-18T19:00:00Z', group: 'B', stadium: 'SoFi Stadium, Inglewood' },
    { homeTeam: 'Canadá',               awayTeam: 'Catar',                datetime: '2026-06-18T22:00:00Z', group: 'B', stadium: 'BC Place, Vancouver' },
    { homeTeam: 'Suíça',                awayTeam: 'Canadá',               datetime: '2026-06-24T19:00:00Z', group: 'B', stadium: 'BC Place, Vancouver' },
    { homeTeam: 'Bósnia e Herzegovina', awayTeam: 'Catar',                datetime: '2026-06-24T19:00:00Z', group: 'B', stadium: 'Lumen Field, Seattle' },

    // ── GRUPO C: Brasil | Marrocos | Haiti | Escócia ──────────────────────────
    { homeTeam: 'Brasil',   awayTeam: 'Marrocos', datetime: '2026-06-13T22:00:00Z', group: 'C', stadium: 'MetLife Stadium, East Rutherford' },
    { homeTeam: 'Haiti',    awayTeam: 'Escócia',  datetime: '2026-06-14T01:00:00Z', group: 'C', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'Escócia',  awayTeam: 'Marrocos', datetime: '2026-06-19T22:00:00Z', group: 'C', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'Brasil',   awayTeam: 'Haiti',    datetime: '2026-06-20T00:30:00Z', group: 'C', stadium: 'Lincoln Financial Field, Filadélfia' },
    { homeTeam: 'Escócia',  awayTeam: 'Brasil',   datetime: '2026-06-24T22:00:00Z', group: 'C', stadium: 'Hard Rock Stadium, Miami' },
    { homeTeam: 'Marrocos', awayTeam: 'Haiti',    datetime: '2026-06-24T22:00:00Z', group: 'C', stadium: 'Mercedes-Benz Stadium, Atlanta' },

    // ── GRUPO D: Estados Unidos | Paraguai | Austrália | Turquia ─────────────
    { homeTeam: 'Estados Unidos', awayTeam: 'Paraguai',  datetime: '2026-06-13T01:00:00Z', group: 'D', stadium: 'SoFi Stadium, Inglewood' },
    { homeTeam: 'Austrália',      awayTeam: 'Turquia',   datetime: '2026-06-13T04:00:00Z', group: 'D', stadium: 'BC Place, Vancouver' },
    { homeTeam: 'Estados Unidos', awayTeam: 'Austrália', datetime: '2026-06-19T19:00:00Z', group: 'D', stadium: 'Lumen Field, Seattle' },
    { homeTeam: 'Turquia',        awayTeam: 'Paraguai',  datetime: '2026-06-20T03:00:00Z', group: 'D', stadium: "Levi's Stadium, Santa Clara" },
    { homeTeam: 'Austrália',      awayTeam: 'Paraguai',  datetime: '2026-06-24T19:00:00Z', group: 'D', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'Estados Unidos', awayTeam: 'Turquia',   datetime: '2026-06-24T19:00:00Z', group: 'D', stadium: 'AT&T Stadium, Arlington' },

    // ── GRUPO E: Alemanha | Curaçao | Costa do Marfim | Equador ─────────────
    { homeTeam: 'Alemanha',       awayTeam: 'Curaçao',        datetime: '2026-06-14T17:00:00Z', group: 'E', stadium: 'NRG Stadium, Houston' },
    { homeTeam: 'Costa do Marfim',awayTeam: 'Equador',        datetime: '2026-06-14T23:00:00Z', group: 'E', stadium: 'Lincoln Financial Field, Filadélfia' },
    { homeTeam: 'Alemanha',       awayTeam: 'Costa do Marfim',datetime: '2026-06-20T20:00:00Z', group: 'E', stadium: 'BMO Field, Toronto' },
    { homeTeam: 'Equador',        awayTeam: 'Curaçao',        datetime: '2026-06-21T00:00:00Z', group: 'E', stadium: "Children's Mercy Park, Kansas City" },
    { homeTeam: 'Equador',        awayTeam: 'Alemanha',       datetime: '2026-06-25T20:00:00Z', group: 'E', stadium: 'MetLife Stadium, East Rutherford' },
    { homeTeam: 'Curaçao',        awayTeam: 'Costa do Marfim',datetime: '2026-06-25T20:00:00Z', group: 'E', stadium: 'Lincoln Financial Field, Filadélfia' },

    // ── GRUPO F: Holanda | Japão | Suécia | Tunísia ──────────────────────────
    { homeTeam: 'Holanda', awayTeam: 'Japão',   datetime: '2026-06-14T20:00:00Z', group: 'F', stadium: 'AT&T Stadium, Arlington' },
    { homeTeam: 'Suécia',  awayTeam: 'Tunísia', datetime: '2026-06-15T02:00:00Z', group: 'F', stadium: 'Estadio Akron, Guadalajara' },
    { homeTeam: 'Holanda', awayTeam: 'Suécia',  datetime: '2026-06-20T17:00:00Z', group: 'F', stadium: 'NRG Stadium, Houston' },
    { homeTeam: 'Tunísia', awayTeam: 'Japão',   datetime: '2026-06-21T04:00:00Z', group: 'F', stadium: 'Estadio Akron, Guadalajara' },
    { homeTeam: 'Japão',   awayTeam: 'Suécia',  datetime: '2026-06-25T23:00:00Z', group: 'F', stadium: 'AT&T Stadium, Arlington' },
    { homeTeam: 'Tunísia', awayTeam: 'Holanda', datetime: '2026-06-25T23:00:00Z', group: 'F', stadium: "Children's Mercy Park, Kansas City" },

    // ── GRUPO G: Bélgica | Egito | Irã | Nova Zelândia ───────────────────────
    { homeTeam: 'Bélgica',      awayTeam: 'Egito',        datetime: '2026-06-15T22:00:00Z', group: 'G', stadium: 'Lumen Field, Seattle' },
    { homeTeam: 'Irã',          awayTeam: 'Nova Zelândia',datetime: '2026-06-16T04:00:00Z', group: 'G', stadium: 'SoFi Stadium, Inglewood' },
    { homeTeam: 'Bélgica',      awayTeam: 'Irã',          datetime: '2026-06-21T19:00:00Z', group: 'G', stadium: 'SoFi Stadium, Inglewood' },
    { homeTeam: 'Nova Zelândia',awayTeam: 'Egito',        datetime: '2026-06-22T01:00:00Z', group: 'G', stadium: 'BC Place, Vancouver' },
    { homeTeam: 'Egito',        awayTeam: 'Irã',          datetime: '2026-06-27T03:00:00Z', group: 'G', stadium: 'Lumen Field, Seattle' },
    { homeTeam: 'Nova Zelândia',awayTeam: 'Bélgica',      datetime: '2026-06-27T03:00:00Z', group: 'G', stadium: 'BC Place, Vancouver' },

    // ── GRUPO H: Espanha | Cabo Verde | Arábia Saudita | Uruguai ─────────────
    { homeTeam: 'Espanha',       awayTeam: 'Cabo Verde',    datetime: '2026-06-15T17:00:00Z', group: 'H', stadium: 'Mercedes-Benz Stadium, Atlanta' },
    { homeTeam: 'Arábia Saudita',awayTeam: 'Uruguai',       datetime: '2026-06-15T22:00:00Z', group: 'H', stadium: 'Hard Rock Stadium, Miami' },
    { homeTeam: 'Espanha',       awayTeam: 'Arábia Saudita',datetime: '2026-06-21T16:00:00Z', group: 'H', stadium: 'Mercedes-Benz Stadium, Atlanta' },
    { homeTeam: 'Uruguai',       awayTeam: 'Cabo Verde',    datetime: '2026-06-21T22:00:00Z', group: 'H', stadium: 'Hard Rock Stadium, Miami' },
    { homeTeam: 'Cabo Verde',    awayTeam: 'Arábia Saudita',datetime: '2026-06-27T00:00:00Z', group: 'H', stadium: 'NRG Stadium, Houston' },
    { homeTeam: 'Uruguai',       awayTeam: 'Espanha',       datetime: '2026-06-27T00:00:00Z', group: 'H', stadium: 'Estadio Akron, Guadalajara' },

    // ── GRUPO I: França | Senegal | Iraque | Noruega ──────────────────────────
    { homeTeam: 'França',   awayTeam: 'Senegal',  datetime: '2026-06-16T19:00:00Z', group: 'I', stadium: 'MetLife Stadium, East Rutherford' },
    { homeTeam: 'Iraque',   awayTeam: 'Noruega',  datetime: '2026-06-16T22:00:00Z', group: 'I', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'França',   awayTeam: 'Iraque',   datetime: '2026-06-22T21:00:00Z', group: 'I', stadium: 'Lincoln Financial Field, Filadélfia' },
    { homeTeam: 'Noruega',  awayTeam: 'Senegal',  datetime: '2026-06-23T00:00:00Z', group: 'I', stadium: 'MetLife Stadium, East Rutherford' },
    { homeTeam: 'Noruega',  awayTeam: 'França',   datetime: '2026-06-26T19:00:00Z', group: 'I', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'Senegal',  awayTeam: 'Iraque',   datetime: '2026-06-26T19:00:00Z', group: 'I', stadium: 'BMO Field, Toronto' },

    // ── GRUPO J: Argentina | Argélia | Áustria | Jordânia ────────────────────
    { homeTeam: 'Argentina', awayTeam: 'Argélia',  datetime: '2026-06-17T01:00:00Z', group: 'J', stadium: "Children's Mercy Park, Kansas City" },
    { homeTeam: 'Áustria',   awayTeam: 'Jordânia', datetime: '2026-06-17T04:00:00Z', group: 'J', stadium: "Levi's Stadium, Santa Clara" },
    { homeTeam: 'Argentina', awayTeam: 'Áustria',  datetime: '2026-06-22T17:00:00Z', group: 'J', stadium: 'AT&T Stadium, Arlington' },
    { homeTeam: 'Jordânia',  awayTeam: 'Argélia',  datetime: '2026-06-23T03:00:00Z', group: 'J', stadium: "Levi's Stadium, Santa Clara" },
    { homeTeam: 'Argélia',   awayTeam: 'Áustria',  datetime: '2026-06-28T02:00:00Z', group: 'J', stadium: "Children's Mercy Park, Kansas City" },
    { homeTeam: 'Jordânia',  awayTeam: 'Argentina',datetime: '2026-06-28T02:00:00Z', group: 'J', stadium: 'AT&T Stadium, Arlington' },

    // ── GRUPO K: Portugal | República Democrática do Congo | Uzbequistão | Colômbia
    { homeTeam: 'Portugal',                      awayTeam: 'República Democrática do Congo', datetime: '2026-06-17T17:00:00Z', group: 'K', stadium: 'NRG Stadium, Houston' },
    { homeTeam: 'Uzbequistão',                   awayTeam: 'Colômbia',                       datetime: '2026-06-18T02:00:00Z', group: 'K', stadium: 'Estadio Azteca, Cidade do México' },
    { homeTeam: 'Portugal',                      awayTeam: 'Uzbequistão',                    datetime: '2026-06-23T17:00:00Z', group: 'K', stadium: 'NRG Stadium, Houston' },
    { homeTeam: 'Colômbia',                      awayTeam: 'República Democrática do Congo', datetime: '2026-06-24T02:00:00Z', group: 'K', stadium: 'Estadio Akron, Guadalajara' },
    { homeTeam: 'Colômbia',                      awayTeam: 'Portugal',                       datetime: '2026-06-27T23:30:00Z', group: 'K', stadium: 'Hard Rock Stadium, Miami' },
    { homeTeam: 'República Democrática do Congo',awayTeam: 'Uzbequistão',                    datetime: '2026-06-27T23:30:00Z', group: 'K', stadium: 'Mercedes-Benz Stadium, Atlanta' },

    // ── GRUPO L: Inglaterra | Croácia | Gana | Panamá ────────────────────────
    { homeTeam: 'Inglaterra', awayTeam: 'Croácia', datetime: '2026-06-17T20:00:00Z', group: 'L', stadium: 'AT&T Stadium, Arlington' },
    { homeTeam: 'Gana',       awayTeam: 'Panamá',  datetime: '2026-06-17T23:00:00Z', group: 'L', stadium: 'BMO Field, Toronto' },
    { homeTeam: 'Inglaterra', awayTeam: 'Gana',    datetime: '2026-06-23T20:00:00Z', group: 'L', stadium: 'Gillette Stadium, Foxborough' },
    { homeTeam: 'Panamá',     awayTeam: 'Croácia', datetime: '2026-06-23T23:00:00Z', group: 'L', stadium: 'BMO Field, Toronto' },
    { homeTeam: 'Panamá',     awayTeam: 'Inglaterra',datetime: '2026-06-27T21:00:00Z', group: 'L', stadium: 'MetLife Stadium, East Rutherford' },
    { homeTeam: 'Croácia',    awayTeam: 'Gana',    datetime: '2026-06-27T21:00:00Z', group: 'L', stadium: 'Lincoln Financial Field, Filadélfia' },
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
    console.log(`Jogo criado: ${match.homeTeam} x ${match.awayTeam}`);
  }
}
