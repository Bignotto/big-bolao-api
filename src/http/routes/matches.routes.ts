import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { getMatchPredictions } from '../controllers/matches/getMatchPredictions';

export async function matchesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get('/matches/:matchId/predictions', getMatchPredictions);
}
