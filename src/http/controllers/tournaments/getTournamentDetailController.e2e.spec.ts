import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { MatchStatus } from '@prisma/client';

import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { PrismaPoolsRepository } from '@/repositories/pools/PrismaPoolsRepository';
import { PrismaTeamsRepository } from '@/repositories/teams/PrismaTeamsRepository';
import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';
import { createTestApp } from '@/test/helper-e2e';
import { getSupabaseAccessToken } from '@/test/mockJwt';
import { createMatchWithTeams } from '@/test/mocks/match';
import { createPoolWithParticipants } from '@/test/mocks/pools';
import { createTournament } from '@/test/mocks/tournament';

type TournamentDetailResponse = {
  tournament: {
    id: number;
    name: string;
    totalMatches: number;
    completedMatches: number;
    totalTeams: number;
    totalPools: number;
  };
};

describe('GET /tournaments/:tournamentId', async () => {
  const app = await createTestApp();
  let token: string;
  let tournamentId: number;

  const tournamentsRepository = new PrismaTournamentsRepository();
  const matchesRepository = new PrismaMatchesRepository();
  const teamsRepository = new PrismaTeamsRepository();
  const poolsRepository = new PrismaPoolsRepository();
  const usersRepository = new PrismaUsersRepository();

  beforeAll(async () => {
    ({ token } = await getSupabaseAccessToken(app));

    const tournament = await createTournament(tournamentsRepository, {});
    tournamentId = tournament.id;

    // Matches: 2 completed, 1 scheduled
    await createMatchWithTeams({ matchesRepository, teamsRepository }, {
      tournamentId,
      matchStatus: MatchStatus.COMPLETED,
    });
    await createMatchWithTeams({ matchesRepository, teamsRepository }, {
      tournamentId,
      matchStatus: MatchStatus.COMPLETED,
    });
    await createMatchWithTeams({ matchesRepository, teamsRepository }, {
      tournamentId,
      matchStatus: MatchStatus.SCHEDULED,
    });

    // Two pools for this tournament
    await createPoolWithParticipants({ poolsRepository, usersRepository }, { tournamentId });
    await createPoolWithParticipants({ poolsRepository, usersRepository }, { tournamentId });
  });

  it('returns tournament metadata and stats', async () => {
    const response = await request(app.server)
      .get(`/tournaments/${tournamentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const body = response.body as TournamentDetailResponse;
    expect(body.tournament.id).toBe(tournamentId);
    expect(body.tournament.totalMatches).toBe(3);
    expect(body.tournament.completedMatches).toBe(2);
    expect(body.tournament.totalPools).toBe(2);
  });

  it('requires authentication', async () => {
    const response = await request(app.server).get(`/tournaments/${tournamentId}`);
    expect(response.status).toBe(401);
  });

  it('returns 404 for non-existent tournament', async () => {
    const response = await request(app.server)
      .get(`/tournaments/999999`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('returns 400 when tournamentId is invalid', async () => {
    const response = await request(app.server)
      .get(`/tournaments/abc`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(400);
  });
});

