import { FastifyInstance } from 'fastify';
import { JoinPoolController } from '../controllers/pool/joinPoolController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/pools/join', JoinPoolController);
}
