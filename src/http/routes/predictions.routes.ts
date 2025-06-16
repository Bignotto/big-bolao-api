import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { createPredictionController } from '../controllers/predictions/createPredictionController';

export async function PredictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/predictions', createPredictionController);
}
