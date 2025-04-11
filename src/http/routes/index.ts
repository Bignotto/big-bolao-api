import { FastifyInstance } from 'fastify';
import { matchesRoutes } from './matches.routes';
import { UserRoutes } from './user.routes';

export async function routes(app: FastifyInstance) {
  app.register(UserRoutes);
  app.register(matchesRoutes);
}
