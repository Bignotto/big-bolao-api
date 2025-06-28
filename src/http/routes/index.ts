import { FastifyInstance } from 'fastify';
import { matchesRoutes } from './matches.routes';
import { PoolRoutes } from './pools.routes';
import { PredictionsRoutes } from './predictions.routes';
import { tournamentsRoutes } from './tournaments.routes';
import { UserRoutes } from './user.routes';

export async function routes(app: FastifyInstance) {
  app.register(UserRoutes);
  app.register(matchesRoutes);
  app.register(PoolRoutes);
  app.register(PredictionsRoutes);
  app.register(tournamentsRoutes);
}
