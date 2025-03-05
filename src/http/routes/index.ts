import { FastifyInstance } from 'fastify';
import { UserRoutes } from './user.routes';

export async function routes(app: FastifyInstance) {
  app.register(UserRoutes);
}
