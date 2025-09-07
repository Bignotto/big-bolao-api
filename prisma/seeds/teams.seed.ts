import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTeams() {
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

