import { FastifyInstance } from 'fastify';
import { CreateUserController } from '../controllers/user/createUserController';

export async function UserRoutes(app: FastifyInstance) {
  app.post('/users', CreateUserController);
}
