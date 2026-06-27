import { FastifyInstance } from 'fastify';

import { getTeamRecentFormController } from '@/http/controllers/teams/getTeamRecentFormController';
import { verifySupabaseToken } from '@/http/middlewares/verifySupabaseToken';

export function teamsRoutes(app: FastifyInstance): void {
  app.register((scoped) => {
    scoped.addHook('onRequest', verifySupabaseToken);

    scoped.get('/teams/:teamId/recent-form', getTeamRecentFormController);
  });
}
