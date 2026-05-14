import { MatchStatus, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const THIAGO_ID = '0694f736-eecc-4451-8a2e-21509473445b';
const TOURNAMENT_ID = 1;

// Completed matches used for ranking
// Match 1: México 2-0 África do Sul
// Match 2: Coreia do Sul 1-1 Tchéquia
// Match 7: Canadá 3-1 Bósnia e Herzegovina
const COMPLETED_MATCHES: [number, number, number][] = [
  [1, 2, 0],
  [2, 1, 1],
  [7, 3, 1],
];

async function main() {
  console.log('Starting demo seed...');

  const passwordHash = await hash('123456', 8);

  // ── Users ────────────────────────────────────────────────────────────────────

  const subsolo2Users = [
    { fullName: 'Gabriel', email: 'gabriel@subsolo2.com' },
    { fullName: 'André', email: 'andre@subsolo2.com' },
    { fullName: 'Pedro', email: 'pedro@subsolo2.com' },
    { fullName: 'Sérgio', email: 'sergio@subsolo2.com' },
    { fullName: 'Edgard', email: 'edgard@subsolo2.com' },
    { fullName: 'Pé', email: 'pe@subsolo2.com' },
    { fullName: 'Rafael', email: 'rafael@subsolo2.com' },
    { fullName: 'Vitor', email: 'vitor@subsolo2.com' },
    { fullName: 'Gelson', email: 'gelson@subsolo2.com' },
  ];

  const familiaUsers = [
    { fullName: 'Thadeu', email: 'thadeu@familia.com' },
    { fullName: 'Nayara', email: 'nayara@familia.com' },
    { fullName: 'Thais', email: 'thais@familia.com' },
    { fullName: 'Edson', email: 'edson@familia.com' },
    { fullName: 'Carlos', email: 'carlos@familia.com' },
    { fullName: 'Denise', email: 'denise@familia.com' },
    { fullName: 'Miriam', email: 'miriam@familia.com' },
    { fullName: 'Giovana', email: 'giovana@familia.com' },
    { fullName: 'Matheus', email: 'matheus@familia.com' },
  ];

  const allNewUsers = [...subsolo2Users, ...familiaUsers];

  const createdUsers = await Promise.all(
    allNewUsers.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { fullName: u.fullName, email: u.email, passwordHash },
      })
    )
  );

  // Global name→id map (includes Thiago)
  const userMap = new Map<string, string>();
  userMap.set('Thiago', THIAGO_ID);
  createdUsers.forEach((u) => userMap.set(u.fullName, u.id));

  console.log(`Users ready (${userMap.size} total)`);

  // ── Set match results (COMPLETED) ────────────────────────────────────────────

  for (const [matchId, homeScore, awayScore] of COMPLETED_MATCHES) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeTeamScore: homeScore,
        awayTeamScore: awayScore,
        matchStatus: MatchStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });
  }

  console.log(`Set ${COMPLETED_MATCHES.length} matches to COMPLETED`);

  // ── Pool helper ──────────────────────────────────────────────────────────────

  async function seedPool(opts: {
    name: string;
    description: string;
    inviteCode: string;
    memberNames: string[];
    // [matchId, predictedHome, predictedAway] per member (same order as memberNames)
    predictions: Record<string, [number, number, number][]>;
  }) {
    const pool = await prisma.pool.upsert({
      where: { inviteCode: opts.inviteCode },
      update: {},
      create: {
        name: opts.name,
        description: opts.description,
        inviteCode: opts.inviteCode,
        tournamentId: TOURNAMENT_ID,
        creatorId: THIAGO_ID,
      },
    });

    await prisma.scoringRule.upsert({
      where: { poolId: pool.id },
      update: {},
      create: {
        poolId: pool.id,
        exactScorePoints: 5,
        correctWinnerGoalDiffPoints: 3,
        correctWinnerPoints: 2,
        correctDrawPoints: 2,
        specialEventPoints: 3,
        knockoutMultiplier: 1.5,
        finalMultiplier: 2.0,
      },
    });

    const memberIds = opts.memberNames.map((n) => {
      const id = userMap.get(n);
      if (!id) throw new Error(`User "${n}" not found in userMap`);
      return id;
    });

    await Promise.all(
      memberIds.map((userId) =>
        prisma.poolParticipant.upsert({
          where: { poolId_userId: { poolId: pool.id, userId } },
          update: {},
          create: { poolId: pool.id, userId },
        })
      )
    );

    let predCount = 0;
    for (const [name, preds] of Object.entries(opts.predictions)) {
      const userId = userMap.get(name);
      if (!userId) {
        console.warn(`No user found for "${name}", skipping predictions`);
        continue;
      }
      for (const [matchId, home, away] of preds) {
        await prisma.prediction.upsert({
          where: { poolId_matchId_userId: { poolId: pool.id, matchId, userId } },
          update: { predictedHomeScore: home, predictedAwayScore: away, updatedAt: new Date() },
          create: {
            poolId: pool.id,
            matchId,
            userId,
            predictedHomeScore: home,
            predictedAwayScore: away,
            predictedHasExtraTime: false,
            predictedHasPenalties: false,
            submittedAt: new Date(),
          },
        });
        predCount++;
      }
    }

    console.log(`Pool "${pool.name}" (id=${pool.id}): ${opts.memberNames.length} members, ${predCount} predictions`);
    return pool;
  }

  // ── Pool: Subsolo2 ───────────────────────────────────────────────────────────
  //
  // Completed-match points breakdown [M1 2-0, M2 1-1, M7 3-1]:
  //   Thiago:  2-0(5) + 1-1(5) + 3-1(5) = 15  (3 exact)
  //   Gabriel: 2-0(5) + 1-1(5) + 2-1(2) = 12  (2 exact)
  //   Vitor:   1-0(2) + 1-1(5) + 3-1(5) = 12  (2 exact)
  //   André:   1-0(2) + 1-1(5) + 1-0(2) =  9  (1 exact)
  //   Rafael:  2-0(5) + 0-2(0) + 1-0(2) =  7  (1 exact)
  //   Pedro:   3-1(3) + 2-2(2) + 2-1(2) =  7  (0 exact)
  //   Edgard:  2-1(2) + 0-0(2) + 1-0(2) =  6  (0 exact)
  //   Gelson:  3-0(2) + 1-0(0) + 2-1(2) =  4  (0 exact)
  //   Pé:      1-1(0) + 2-1(0) + 1-0(2) =  2  (0 exact)
  //   Sérgio:  0-1(0) + 1-0(0) + 1-2(0) =  0  (0 exact)
  //
  // Future matches covered: 8 (Catar-Suíça), 13 (Brasil-Marrocos),
  //   14 (Haiti-Escócia), 19 (EUA-Paraguai), 20 (Aus-Turquia), 25 (Alemanha-Curaçao)

  await seedPool({
    name: 'Subsolo2',
    description: 'Pool do Subsolo para a Copa do Mundo 2026',
    inviteCode: 'SUBSOLO2',
    memberNames: ['Thiago', 'Gabriel', 'André', 'Pedro', 'Sérgio', 'Edgard', 'Pé', 'Rafael', 'Vitor', 'Gelson'],
    predictions: {
      Thiago:  [[1,2,0],[2,1,1],[7,3,1],[8,0,2],[13,3,1],[14,0,1],[19,2,0],[20,1,1],[25,4,0]],
      Gabriel: [[1,2,0],[2,1,1],[7,2,1],[8,1,1],[13,2,0],[14,0,2],[19,1,0],[20,0,2],[25,3,0]],
      André:   [[1,1,0],[2,1,1],[7,1,0],[8,0,1],[13,2,1],[14,1,1],[19,2,1],[20,1,0],[25,3,1]],
      Pedro:   [[1,3,1],[2,2,2],[7,2,1],[8,1,2],[13,1,1],[14,0,1],[19,1,1],[20,0,1],[25,2,0]],
      Sérgio:  [[1,0,1],[2,1,0],[7,1,2],[8,0,0],[13,2,0],[14,1,2],[19,2,0],[20,1,1],[25,3,0]],
      Edgard:  [[1,2,1],[2,0,0],[7,1,0],[8,0,2],[13,3,0],[14,0,1],[19,2,1],[20,0,0],[25,2,1]],
      Pé:      [[1,1,1],[2,2,1],[7,1,0],[8,1,0],[13,1,0],[14,2,1],[19,1,0],[20,2,0],[25,4,1]],
      Rafael:  [[1,2,0],[2,0,2],[7,1,0],[8,0,1],[13,2,1],[14,0,2],[19,3,1],[20,1,2],[25,2,0]],
      Vitor:   [[1,1,0],[2,1,1],[7,3,1],[8,1,1],[13,2,0],[14,0,0],[19,2,0],[20,1,0],[25,3,0]],
      Gelson:  [[1,3,0],[2,1,0],[7,2,1],[8,0,2],[13,1,0],[14,0,1],[19,1,0],[20,0,1],[25,3,1]],
    },
  });

  // ── Pool: Família ────────────────────────────────────────────────────────────
  //
  // Completed-match points breakdown [M1 2-0, M2 1-1, M7 3-1]:
  //   Thiago:  2-0(5) + 1-1(5) + 3-1(5) = 15  (3 exact)
  //   Thais:   2-1(2) + 1-1(5) + 2-0(2) =  9  (1 exact)
  //   Matheus: 1-0(2) + 1-1(5) + 3-0(2) =  9  (1 exact)
  //   Carlos:  2-0(5) + 0-1(0) + 1-0(2) =  7  (1 exact)
  //   Denise:  1-0(2) + 1-1(5) + 1-2(0) =  7  (1 exact)
  //   Giovana: 2-0(5) + 2-1(0) + 2-0(2) =  7  (1 exact)
  //   Miriam:  3-1(3) + 0-0(2) + 2-1(2) =  7  (0 exact)
  //   Nayara:  3-0(2) + 2-2(2) + 1-0(2) =  6  (0 exact)
  //   Thadeu:  1-0(2) + 0-0(2) + 2-1(2) =  6  (0 exact)
  //   Edson:   0-0(0) + 1-0(0) + 0-0(0) =  0  (0 exact)

  await seedPool({
    name: 'Família',
    description: 'Pool da família para a Copa do Mundo 2026',
    inviteCode: 'FAMILIA26',
    memberNames: ['Thiago', 'Thadeu', 'Nayara', 'Thais', 'Edson', 'Carlos', 'Denise', 'Miriam', 'Giovana', 'Matheus'],
    predictions: {
      Thiago:  [[1,2,0],[2,1,1],[7,3,1],[8,0,2],[13,3,1],[14,0,1],[19,2,0],[20,1,1],[25,4,0]],
      Thadeu:  [[1,1,0],[2,0,0],[7,2,1],[8,1,1],[13,2,1],[14,0,2],[19,1,1],[20,0,1],[25,2,0]],
      Nayara:  [[1,3,0],[2,2,2],[7,1,0],[8,0,1],[13,1,1],[14,1,0],[19,2,0],[20,1,0],[25,3,1]],
      Thais:   [[1,2,1],[2,1,1],[7,1,0],[8,1,2],[13,2,0],[14,0,1],[19,1,0],[20,2,1],[25,2,0]],
      Edson:   [[1,0,0],[2,1,0],[7,0,0],[8,0,0],[13,0,1],[14,1,1],[19,0,1],[20,0,0],[25,1,0]],
      Carlos:  [[1,2,0],[2,0,1],[7,1,0],[8,0,2],[13,2,1],[14,0,0],[19,2,1],[20,0,2],[25,3,0]],
      Denise:  [[1,1,0],[2,1,1],[7,1,2],[8,1,0],[13,3,0],[14,0,1],[19,1,0],[20,1,1],[25,2,1]],
      Miriam:  [[1,3,1],[2,0,0],[7,2,1],[8,0,1],[13,2,0],[14,1,2],[19,2,0],[20,0,1],[25,3,0]],
      Giovana: [[1,2,0],[2,2,1],[7,1,0],[8,1,2],[13,1,0],[14,0,1],[19,1,1],[20,1,0],[25,2,0]],
      Matheus: [[1,1,0],[2,1,1],[7,3,0],[8,0,0],[13,2,0],[14,0,1],[19,2,1],[20,0,0],[25,3,1]],
    },
  });

  console.log('\nDemo seed complete!');
  console.log('Subsolo2 ranking: Thiago(15) Gabriel(12) Vitor(12) André(9) Rafael(7) Pedro(7) Edgard(6) Gelson(4) Pé(2) Sérgio(0)');
  console.log('Família ranking:  Thiago(15) Thais(9) Matheus(9) Carlos(7) Denise(7) Giovana(7) Miriam(7) Nayara(6) Thadeu(6) Edson(0)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
