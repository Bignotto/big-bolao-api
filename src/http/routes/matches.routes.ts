import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { getMatchController } from '../controllers/matches/getMatchController';
import { getMatchPredictions } from '../controllers/matches/getMatchPredictions';
import { updateMatchController } from '../controllers/matches/updateMatchController';

export async function matchesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get('/matches/:matchId', getMatchController);
  app.get('/matches/:matchId/predictions', getMatchPredictions);
  app.put('/matches/:matchId', updateMatchController);
}
