import { FastifyInstance } from 'fastify';

import { matchesRoutes } from '@/http/routes/matches.routes';
import { poolRoutes } from '@/http/routes/pools.routes';
import { predictionsRoutes } from '@/http/routes/predictions.routes';
import { tournamentsRoutes } from '@/http/routes/tournaments.routes';
import { userRoutes } from '@/http/routes/user.routes';

export function routes(app: FastifyInstance): void {
  app.register(userRoutes);
  app.register(matchesRoutes);
  app.register(poolRoutes);
  app.register(predictionsRoutes);
  app.register(tournamentsRoutes);
}
