import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { createPredictionController } from '../controllers/predictions/createPredictionController';
import { getPredictionController } from '../controllers/predictions/getPredictionController';
import { updatePredictionController } from '../controllers/predictions/updatePredictionController';

export async function PredictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/predictions', createPredictionController);
  app.get('/predictions/:predictionId', getPredictionController);
  app.put('/predictions/:predictionId', updatePredictionController);
}
