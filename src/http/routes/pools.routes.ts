import { FastifyInstance } from 'fastify';
import { getPoolUsersController } from '../controllers/pools/getPoolUsersController';
import { JoinPoolController } from '../controllers/pools/joinPoolController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/pools/join', JoinPoolController);
  app.get('/pools/:poolId/users', getPoolUsersController);
}
