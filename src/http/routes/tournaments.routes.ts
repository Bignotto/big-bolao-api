import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { listTournamentsController } from '../controllers/tournaments/listTournamentsController';
import { getTournamentMatchesController } from '../controllers/tournaments/getTournamentMatchesController';

export async function tournamentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get('/tournaments', listTournamentsController);
  app.get('/tournaments/:tournamentId/matches', getTournamentMatchesController);
}
