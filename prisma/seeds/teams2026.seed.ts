import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTeams2026() {
  // Todos os 48 times qualificados — Copa do Mundo FIFA 2026
  // Nomes em português do Brasil
  const teamsData = [
    // Grupo A
    { name: 'México',       countryCode: 'MEX', flagUrl: 'https://flagcdn.com/mx.svg' },
    { name: 'Coreia do Sul',countryCode: 'KOR', flagUrl: 'https://flagcdn.com/kr.svg' },
    { name: 'África do Sul',countryCode: 'ZAF', flagUrl: 'https://flagcdn.com/za.svg' },
    { name: 'Tchéquia',     countryCode: 'CZE', flagUrl: 'https://flagcdn.com/cz.svg' },

    // Grupo B
    { name: 'Canadá',               countryCode: 'CAN', flagUrl: 'https://flagcdn.com/ca.svg' },
    { name: 'Bósnia e Herzegovina', countryCode: 'BIH', flagUrl: 'https://flagcdn.com/ba.svg' },
    { name: 'Catar',                countryCode: 'QAT', flagUrl: 'https://flagcdn.com/qa.svg' },
    { name: 'Suíça',                countryCode: 'SUI', flagUrl: 'https://flagcdn.com/ch.svg' },

    // Grupo C
    { name: 'Brasil',   countryCode: 'BRA', flagUrl: 'https://flagcdn.com/br.svg' },
    { name: 'Marrocos', countryCode: 'MAR', flagUrl: 'https://flagcdn.com/ma.svg' },
    { name: 'Haiti',    countryCode: 'HAI', flagUrl: 'https://flagcdn.com/ht.svg' },
    { name: 'Escócia',  countryCode: 'SCO', flagUrl: 'https://flagcdn.com/gb-sct.svg' },

    // Grupo D
    { name: 'Estados Unidos', countryCode: 'USA', flagUrl: 'https://flagcdn.com/us.svg' },
    { name: 'Paraguai',       countryCode: 'PAR', flagUrl: 'https://flagcdn.com/py.svg' },
    { name: 'Austrália',      countryCode: 'AUS', flagUrl: 'https://flagcdn.com/au.svg' },
    { name: 'Turquia',        countryCode: 'TUR', flagUrl: 'https://flagcdn.com/tr.svg' },

    // Grupo E
    { name: 'Alemanha',       countryCode: 'GER', flagUrl: 'https://flagcdn.com/de.svg' },
    { name: 'Curaçao',        countryCode: 'CUW', flagUrl: 'https://flagcdn.com/cw.svg' },
    { name: 'Costa do Marfim',countryCode: 'CIV', flagUrl: 'https://flagcdn.com/ci.svg' },
    { name: 'Equador',        countryCode: 'ECU', flagUrl: 'https://flagcdn.com/ec.svg' },

    // Grupo F
    { name: 'Holanda', countryCode: 'NED', flagUrl: 'https://flagcdn.com/nl.svg' },
    { name: 'Japão',   countryCode: 'JPN', flagUrl: 'https://flagcdn.com/jp.svg' },
    { name: 'Suécia',  countryCode: 'SWE', flagUrl: 'https://flagcdn.com/se.svg' },
    { name: 'Tunísia', countryCode: 'TUN', flagUrl: 'https://flagcdn.com/tn.svg' },

    // Grupo G
    { name: 'Bélgica',      countryCode: 'BEL', flagUrl: 'https://flagcdn.com/be.svg' },
    { name: 'Egito',        countryCode: 'EGY', flagUrl: 'https://flagcdn.com/eg.svg' },
    { name: 'Irã',          countryCode: 'IRN', flagUrl: 'https://flagcdn.com/ir.svg' },
    { name: 'Nova Zelândia',countryCode: 'NZL', flagUrl: 'https://flagcdn.com/nz.svg' },

    // Grupo H
    { name: 'Espanha',       countryCode: 'ESP', flagUrl: 'https://flagcdn.com/es.svg' },
    { name: 'Cabo Verde',    countryCode: 'CPV', flagUrl: 'https://flagcdn.com/cv.svg' },
    { name: 'Arábia Saudita',countryCode: 'KSA', flagUrl: 'https://flagcdn.com/sa.svg' },
    { name: 'Uruguai',       countryCode: 'URU', flagUrl: 'https://flagcdn.com/uy.svg' },

    // Grupo I
    { name: 'França',   countryCode: 'FRA', flagUrl: 'https://flagcdn.com/fr.svg' },
    { name: 'Senegal',  countryCode: 'SEN', flagUrl: 'https://flagcdn.com/sn.svg' },
    { name: 'Iraque',   countryCode: 'IRQ', flagUrl: 'https://flagcdn.com/iq.svg' },
    { name: 'Noruega',  countryCode: 'NOR', flagUrl: 'https://flagcdn.com/no.svg' },

    // Grupo J
    { name: 'Argentina', countryCode: 'ARG', flagUrl: 'https://flagcdn.com/ar.svg' },
    { name: 'Argélia',   countryCode: 'ALG', flagUrl: 'https://flagcdn.com/dz.svg' },
    { name: 'Áustria',   countryCode: 'AUT', flagUrl: 'https://flagcdn.com/at.svg' },
    { name: 'Jordânia',  countryCode: 'JOR', flagUrl: 'https://flagcdn.com/jo.svg' },

    // Grupo K
    { name: 'Portugal',                     countryCode: 'POR', flagUrl: 'https://flagcdn.com/pt.svg' },
    { name: 'República Democrática do Congo',countryCode: 'COD', flagUrl: 'https://flagcdn.com/cd.svg' },
    { name: 'Uzbequistão',                  countryCode: 'UZB', flagUrl: 'https://flagcdn.com/uz.svg' },
    { name: 'Colômbia',                     countryCode: 'COL', flagUrl: 'https://flagcdn.com/co.svg' },

    // Grupo L
    { name: 'Inglaterra', countryCode: 'ENG', flagUrl: 'https://flagcdn.com/gb-eng.svg' },
    { name: 'Croácia',    countryCode: 'CRO', flagUrl: 'https://flagcdn.com/hr.svg' },
    { name: 'Gana',       countryCode: 'GHA', flagUrl: 'https://flagcdn.com/gh.svg' },
    { name: 'Panamá',     countryCode: 'PAN', flagUrl: 'https://flagcdn.com/pa.svg' },
  ];

  const teams = [];
  for (const team of teamsData) {
    const existing = await prisma.team.findFirst({ where: { name: team.name } });
    if (existing) {
      teams.push(existing);
      console.log(`Time encontrado: ${team.name}`);
    } else {
      const created = await prisma.team.create({ data: team });
      teams.push(created);
      console.log(`Time criado: ${team.name}`);
    }
  }

  return teams;
}
