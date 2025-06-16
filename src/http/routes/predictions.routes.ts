import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { createPredictionController } from '../controllers/predictions/createPredictionController';
import { getPredictionController } from '../controllers/predictions/getPredictionController';

export async function PredictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/predictions', createPredictionController);
  app.get('/predictions/:predictionId', getPredictionController);
}
