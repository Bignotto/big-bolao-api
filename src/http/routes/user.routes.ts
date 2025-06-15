import { FastifyInstance } from 'fastify';
import { CreateUserController } from '../controllers/user/createUserController';
import { GetLoggedUserInfoController } from '../controllers/user/getLoggedUserInfoController';
import { GetUserInfoController } from '../controllers/user/getUserInfoController';
import { getUserPoolsController } from '../controllers/user/getUserPoolsController';
import { UpdateUserController } from '../controllers/user/updateUserController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/users', CreateUserController);
  app.put('/users/:userId', UpdateUserController);
  app.get('/users/:userId', GetUserInfoController);
  app.get('/users/me', GetLoggedUserInfoController);
  app.get('/users/:userId/pools', getUserPoolsController);
}
