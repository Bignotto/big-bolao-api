import { FastifyInstance } from 'fastify';
import { CreateUserController } from '../controllers/user/createUserController';
import { UpdateUserController } from '../controllers/user/updateUserController';

export async function UserRoutes(app: FastifyInstance) {
  app.post('/users', CreateUserController);
  app.put('/users/:userId', UpdateUserController);
}
