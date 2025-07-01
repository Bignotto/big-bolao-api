import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import {
  errorResponseSchema,
  matchSchema,
  tournamentSchema,
  matchIdParam,
} from '../schemas';
import { listTournamentsController } from '../controllers/tournaments/listTournamentsController';
import { getTournamentMatchesController } from '../controllers/tournaments/getTournamentMatchesController';

export async function tournamentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get(
    '/tournaments',
    {
      schema: {
        response: {
          200: { type: 'object', properties: { tournaments: { type: 'array', items: tournamentSchema } } },
        },
      },
    },
    listTournamentsController,
  );
  app.get(
    '/tournaments/:tournamentId/matches',
    {
      schema: {
        params: { type: 'object', properties: { tournamentId: { type: 'string' } }, required: ['tournamentId'] },
        response: {
          200: { type: 'object', properties: { matches: { type: 'array', items: matchSchema } } },
          404: errorResponseSchema,
        },
      },
    },
    getTournamentMatchesController,
  );
}
