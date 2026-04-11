import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTeams2026() {
  // Todos os 48 times qualificados — Copa do Mundo FIFA 2026
  // Nomes em português do Brasil
  // flagUrl: formato PNG 80px via flagcdn.com (compatível com React Native Image sem libs extras)
  const teamsData = [
    // Grupo A
    { name: 'México',       countryCode: 'MEX', flagUrl: 'https://flagcdn.com/w80/mx.png' },
    { name: 'Coreia do Sul',countryCode: 'KOR', flagUrl: 'https://flagcdn.com/w80/kr.png' },
    { name: 'África do Sul',countryCode: 'ZAF', flagUrl: 'https://flagcdn.com/w80/za.png' },
    { name: 'Tchéquia',     countryCode: 'CZE', flagUrl: 'https://flagcdn.com/w80/cz.png' },

    // Grupo B
    { name: 'Canadá',               countryCode: 'CAN', flagUrl: 'https://flagcdn.com/w80/ca.png' },
    { name: 'Bósnia e Herzegovina', countryCode: 'BIH', flagUrl: 'https://flagcdn.com/w80/ba.png' },
    { name: 'Catar',                countryCode: 'QAT', flagUrl: 'https://flagcdn.com/w80/qa.png' },
    { name: 'Suíça',                countryCode: 'SUI', flagUrl: 'https://flagcdn.com/w80/ch.png' },

    // Grupo C
    { name: 'Brasil',   countryCode: 'BRA', flagUrl: 'https://flagcdn.com/w80/br.png' },
    { name: 'Marrocos', countryCode: 'MAR', flagUrl: 'https://flagcdn.com/w80/ma.png' },
    { name: 'Haiti',    countryCode: 'HAI', flagUrl: 'https://flagcdn.com/w80/ht.png' },
    { name: 'Escócia',  countryCode: 'SCO', flagUrl: 'https://flagcdn.com/w80/gb-sct.png' },

    // Grupo D
    { name: 'Estados Unidos', countryCode: 'USA', flagUrl: 'https://flagcdn.com/w80/us.png' },
    { name: 'Paraguai',       countryCode: 'PAR', flagUrl: 'https://flagcdn.com/w80/py.png' },
    { name: 'Austrália',      countryCode: 'AUS', flagUrl: 'https://flagcdn.com/w80/au.png' },
    { name: 'Turquia',        countryCode: 'TUR', flagUrl: 'https://flagcdn.com/w80/tr.png' },

    // Grupo E
    { name: 'Alemanha',       countryCode: 'GER', flagUrl: 'https://flagcdn.com/w80/de.png' },
    { name: 'Curaçao',        countryCode: 'CUW', flagUrl: 'https://flagcdn.com/w80/cw.png' },
    { name: 'Costa do Marfim',countryCode: 'CIV', flagUrl: 'https://flagcdn.com/w80/ci.png' },
    { name: 'Equador',        countryCode: 'ECU', flagUrl: 'https://flagcdn.com/w80/ec.png' },

    // Grupo F
    { name: 'Holanda', countryCode: 'NED', flagUrl: 'https://flagcdn.com/w80/nl.png' },
    { name: 'Japão',   countryCode: 'JPN', flagUrl: 'https://flagcdn.com/w80/jp.png' },
    { name: 'Suécia',  countryCode: 'SWE', flagUrl: 'https://flagcdn.com/w80/se.png' },
    { name: 'Tunísia', countryCode: 'TUN', flagUrl: 'https://flagcdn.com/w80/tn.png' },

    // Grupo G
    { name: 'Bélgica',      countryCode: 'BEL', flagUrl: 'https://flagcdn.com/w80/be.png' },
    { name: 'Egito',        countryCode: 'EGY', flagUrl: 'https://flagcdn.com/w80/eg.png' },
    { name: 'Irã',          countryCode: 'IRN', flagUrl: 'https://flagcdn.com/w80/ir.png' },
    { name: 'Nova Zelândia',countryCode: 'NZL', flagUrl: 'https://flagcdn.com/w80/nz.png' },

    // Grupo H
    { name: 'Espanha',       countryCode: 'ESP', flagUrl: 'https://flagcdn.com/w80/es.png' },
    { name: 'Cabo Verde',    countryCode: 'CPV', flagUrl: 'https://flagcdn.com/w80/cv.png' },
    { name: 'Arábia Saudita',countryCode: 'KSA', flagUrl: 'https://flagcdn.com/w80/sa.png' },
    { name: 'Uruguai',       countryCode: 'URU', flagUrl: 'https://flagcdn.com/w80/uy.png' },

    // Grupo I
    { name: 'França',   countryCode: 'FRA', flagUrl: 'https://flagcdn.com/w80/fr.png' },
    { name: 'Senegal',  countryCode: 'SEN', flagUrl: 'https://flagcdn.com/w80/sn.png' },
    { name: 'Iraque',   countryCode: 'IRQ', flagUrl: 'https://flagcdn.com/w80/iq.png' },
    { name: 'Noruega',  countryCode: 'NOR', flagUrl: 'https://flagcdn.com/w80/no.png' },

    // Grupo J
    { name: 'Argentina', countryCode: 'ARG', flagUrl: 'https://flagcdn.com/w80/ar.png' },
    { name: 'Argélia',   countryCode: 'ALG', flagUrl: 'https://flagcdn.com/w80/dz.png' },
    { name: 'Áustria',   countryCode: 'AUT', flagUrl: 'https://flagcdn.com/w80/at.png' },
    { name: 'Jordânia',  countryCode: 'JOR', flagUrl: 'https://flagcdn.com/w80/jo.png' },

    // Grupo K
    { name: 'Portugal',                      countryCode: 'POR', flagUrl: 'https://flagcdn.com/w80/pt.png' },
    { name: 'República Democrática do Congo', countryCode: 'COD', flagUrl: 'https://flagcdn.com/w80/cd.png' },
    { name: 'Uzbequistão',                   countryCode: 'UZB', flagUrl: 'https://flagcdn.com/w80/uz.png' },
    { name: 'Colômbia',                      countryCode: 'COL', flagUrl: 'https://flagcdn.com/w80/co.png' },

    // Grupo L
    { name: 'Inglaterra', countryCode: 'ENG', flagUrl: 'https://flagcdn.com/w80/gb-eng.png' },
    { name: 'Croácia',    countryCode: 'CRO', flagUrl: 'https://flagcdn.com/w80/hr.png' },
    { name: 'Gana',       countryCode: 'GHA', flagUrl: 'https://flagcdn.com/w80/gh.png' },
    { name: 'Panamá',     countryCode: 'PAN', flagUrl: 'https://flagcdn.com/w80/pa.png' },
  ];

  const teams = [];
  for (const team of teamsData) {
    const existing = await prisma.team.findFirst({
      where: { name: team.name },
    });
    const upserted = existing
      ? await prisma.team.update({
          where: { id: existing.id },
          data: { flagUrl: team.flagUrl, countryCode: team.countryCode },
        })
      : await prisma.team.create({ data: team });
    teams.push(upserted);
    console.log(`Time processado: ${team.name}`);
  }

  return teams;
}
