import { FastifyInstance } from 'fastify';
import { createPoolController } from '../controllers/pools/createPoolController';
import { getPoolController } from '../controllers/pools/getPoolController';
import { getPoolPredictionsController } from '../controllers/pools/getPoolPredictionsController';
import { getPoolStandingsController } from '../controllers/pools/getPoolStandingsController';
import { getPoolUsersController } from '../controllers/pools/getPoolUsersController';
import { JoinPoolController } from '../controllers/pools/joinPoolController';
import { leavePoolController } from '../controllers/pools/leavePoolController';
import { removeUserFromPoolController } from '../controllers/pools/removeUserFromPoolController';
import { updatePoolController } from '../controllers/pools/updatePoolController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function PoolRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/pools', createPoolController);
  app.get('/pools/:poolId', getPoolController);
  app.post('/pools/join', JoinPoolController);
  app.post('/pools/:poolId/leave', leavePoolController);
  app.delete('/pools/:poolId/users/:userId', removeUserFromPoolController);
  app.get('/pools/:poolId/users', getPoolUsersController);
  app.put('/pools/:poolId', updatePoolController);
  app.get('/pools/:poolId/predictions', getPoolPredictionsController);
  app.get('/pools/:poolId/standings', getPoolStandingsController);
}
