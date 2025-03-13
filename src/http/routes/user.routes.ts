import { FastifyInstance } from 'fastify';
import { CreateUserController } from '../controllers/user/createUserController';
import { GetUserInfoController } from '../controllers/user/getUserInfoController';
import { UpdateUserController } from '../controllers/user/updateUserController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/users', CreateUserController);
  app.put('/users/:userId', UpdateUserController);
  app.get('/users/:userId', GetUserInfoController);
}
