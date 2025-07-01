import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import {
  errorResponseSchema,
  matchIdParam,
  matchSchema,
  predictionSchema,
  updateMatchBody,
} from '../schemas';
import { getMatchController } from '../controllers/matches/getMatchController';
import { getMatchPredictions } from '../controllers/matches/getMatchPredictionsController';
import { updateMatchController } from '../controllers/matches/updateMatchController';

export async function matchesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get(
    '/matches/:matchId',
    {
      schema: {
        params: matchIdParam,
        response: {
          200: { type: 'object', properties: { match: matchSchema } },
          404: errorResponseSchema,
        },
      },
    },
    getMatchController,
  );
  app.get(
    '/matches/:matchId/predictions',
    {
      schema: {
        params: matchIdParam,
        response: {
          200: {
            type: 'object',
            properties: { predictions: { type: 'array', items: predictionSchema } },
          },
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    getMatchPredictions,
  );
  app.put(
    '/matches/:matchId',
    {
      schema: {
        params: matchIdParam,
        body: updateMatchBody,
        response: {
          200: { type: 'object', properties: { match: matchSchema } },
          404: errorResponseSchema,
          400: errorResponseSchema,
        },
      },
    },
    updateMatchController,
  );
}
