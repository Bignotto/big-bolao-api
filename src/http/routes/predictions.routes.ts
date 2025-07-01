import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import {
  createPredictionBody,
  errorResponseSchema,
  predictionIdParam,
  predictionSchema,
  updatePredictionBody,
} from '../schemas';
import { createPredictionController } from '../controllers/predictions/createPredictionController';
import { getPredictionController } from '../controllers/predictions/getPredictionController';
import { updatePredictionController } from '../controllers/predictions/updatePredictionController';

export async function PredictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post(
    '/predictions',
    {
      schema: {
        body: createPredictionBody,
        response: {
          201: { type: 'object', properties: { prediction: predictionSchema } },
          404: errorResponseSchema,
          403: errorResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    createPredictionController,
  );
  app.get(
    '/predictions/:predictionId',
    {
      schema: {
        params: predictionIdParam,
        response: {
          200: { type: 'object', properties: { prediction: predictionSchema } },
          404: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    getPredictionController,
  );
  app.put(
    '/predictions/:predictionId',
    {
      schema: {
        params: predictionIdParam,
        body: updatePredictionBody,
        response: {
          200: { type: 'object', properties: { prediction: predictionSchema } },
          404: errorResponseSchema,
          403: errorResponseSchema,
          400: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    updatePredictionController,
  );
}
