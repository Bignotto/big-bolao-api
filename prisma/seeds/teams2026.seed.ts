import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTeams2026() {
  // All 48 teams for the 2026 FIFA World Cup
  // Uses upsert to safely handle teams that also appeared in 2022
  const teamsData = [
    // Group A
    { name: 'Mexico', countryCode: 'MEX', flagUrl: 'https://flagcdn.com/mx.svg' },
    { name: 'South Korea', countryCode: 'KOR', flagUrl: 'https://flagcdn.com/kr.svg' },
    { name: 'South Africa', countryCode: 'RSA', flagUrl: 'https://flagcdn.com/za.svg' },
    { name: 'UEFA Playoff D Winner', countryCode: 'TBD', flagUrl: '' },

    // Group B
    { name: 'Canada', countryCode: 'CAN', flagUrl: 'https://flagcdn.com/ca.svg' },
    { name: 'Switzerland', countryCode: 'SUI', flagUrl: 'https://flagcdn.com/ch.svg' },
    { name: 'Qatar', countryCode: 'QAT', flagUrl: 'https://flagcdn.com/qa.svg' },
    { name: 'UEFA Playoff A Winner', countryCode: 'TBD', flagUrl: '' },

    // Group C
    { name: 'Brazil', countryCode: 'BRA', flagUrl: 'https://flagcdn.com/br.svg' },
    { name: 'Morocco', countryCode: 'MAR', flagUrl: 'https://flagcdn.com/ma.svg' },
    { name: 'Haiti', countryCode: 'HAI', flagUrl: 'https://flagcdn.com/ht.svg' },
    { name: 'Curaçao', countryCode: 'CUW', flagUrl: 'https://flagcdn.com/cw.svg' },

    // Group D
    { name: 'United States', countryCode: 'USA', flagUrl: 'https://flagcdn.com/us.svg' },
    { name: 'Paraguay', countryCode: 'PAR', flagUrl: 'https://flagcdn.com/py.svg' },
    { name: 'Australia', countryCode: 'AUS', flagUrl: 'https://flagcdn.com/au.svg' },
    { name: 'UEFA Playoff C Winner', countryCode: 'TBD', flagUrl: '' },

    // Group E
    { name: 'Germany', countryCode: 'GER', flagUrl: 'https://flagcdn.com/de.svg' },
    { name: 'Côte d\'Ivoire', countryCode: 'CIV', flagUrl: 'https://flagcdn.com/ci.svg' },
    { name: 'Ecuador', countryCode: 'ECU', flagUrl: 'https://flagcdn.com/ec.svg' },
    { name: 'TBD Group E', countryCode: 'TBD', flagUrl: '' },

    // Group F
    { name: 'Netherlands', countryCode: 'NED', flagUrl: 'https://flagcdn.com/nl.svg' },
    { name: 'Japan', countryCode: 'JPN', flagUrl: 'https://flagcdn.com/jp.svg' },
    { name: 'Tunisia', countryCode: 'TUN', flagUrl: 'https://flagcdn.com/tn.svg' },
    { name: 'UEFA Playoff B Winner', countryCode: 'TBD', flagUrl: '' },

    // Group G
    { name: 'Belgium', countryCode: 'BEL', flagUrl: 'https://flagcdn.com/be.svg' },
    { name: 'Egypt', countryCode: 'EGY', flagUrl: 'https://flagcdn.com/eg.svg' },
    { name: 'Iran', countryCode: 'IRN', flagUrl: 'https://flagcdn.com/ir.svg' },
    { name: 'New Zealand', countryCode: 'NZL', flagUrl: 'https://flagcdn.com/nz.svg' },

    // Group H
    { name: 'Spain', countryCode: 'ESP', flagUrl: 'https://flagcdn.com/es.svg' },
    { name: 'Cabo Verde', countryCode: 'CPV', flagUrl: 'https://flagcdn.com/cv.svg' },
    { name: 'Saudi Arabia', countryCode: 'KSA', flagUrl: 'https://flagcdn.com/sa.svg' },
    { name: 'Uruguay', countryCode: 'URU', flagUrl: 'https://flagcdn.com/uy.svg' },

    // Group I
    { name: 'France', countryCode: 'FRA', flagUrl: 'https://flagcdn.com/fr.svg' },
    { name: 'Senegal', countryCode: 'SEN', flagUrl: 'https://flagcdn.com/sn.svg' },
    { name: 'Norway', countryCode: 'NOR', flagUrl: 'https://flagcdn.com/no.svg' },
    { name: 'Inter-Confederation Playoff 2 Winner', countryCode: 'TBD', flagUrl: '' },

    // Group J
    { name: 'Argentina', countryCode: 'ARG', flagUrl: 'https://flagcdn.com/ar.svg' },
    { name: 'Algeria', countryCode: 'ALG', flagUrl: 'https://flagcdn.com/dz.svg' },
    { name: 'Austria', countryCode: 'AUT', flagUrl: 'https://flagcdn.com/at.svg' },
    { name: 'Jordan', countryCode: 'JOR', flagUrl: 'https://flagcdn.com/jo.svg' },

    // Group K
    { name: 'Portugal', countryCode: 'POR', flagUrl: 'https://flagcdn.com/pt.svg' },
    { name: 'Colombia', countryCode: 'COL', flagUrl: 'https://flagcdn.com/co.svg' },
    { name: 'Uzbekistan', countryCode: 'UZB', flagUrl: 'https://flagcdn.com/uz.svg' },
    { name: 'Inter-Confederation Playoff 1 Winner', countryCode: 'TBD', flagUrl: '' },

    // Group L
    { name: 'England', countryCode: 'ENG', flagUrl: 'https://flagcdn.com/gb-eng.svg' },
    { name: 'Croatia', countryCode: 'CRO', flagUrl: 'https://flagcdn.com/hr.svg' },
    { name: 'Ghana', countryCode: 'GHA', flagUrl: 'https://flagcdn.com/gh.svg' },
    { name: 'Panama', countryCode: 'PAN', flagUrl: 'https://flagcdn.com/pa.svg' },
  ];

  const teams = [];
  for (const team of teamsData) {
    const existing = await prisma.team.findFirst({ where: { name: team.name } });
    if (existing) {
      teams.push(existing);
      console.log(`Found existing team: ${team.name}`);
    } else {
      const created = await prisma.team.create({ data: team });
      teams.push(created);
      console.log(`Created team: ${team.name}`);
    }
  }

  return teams;
}
