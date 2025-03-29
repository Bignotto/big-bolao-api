import { FastifyInstance } from 'fastify';
import { getPoolUsersController } from '../controllers/pools/getPoolUsersController';
import { JoinPoolController } from '../controllers/pools/joinPoolController';
import { leavePoolController } from '../controllers/pools/leavePoolController';
import { removeUserFromPoolController } from '../controllers/pools/removeUserFromPoolController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/pools/join', JoinPoolController);
  app.post('/pools/:poolId/leave', leavePoolController);
  app.delete('/pools/:poolId/users/:userId', removeUserFromPoolController);
  app.get('/pools/:poolId/users', getPoolUsersController);
}
