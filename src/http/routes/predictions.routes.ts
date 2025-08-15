import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { createPredictionController } from '../controllers/predictions/createPredictionController';
import { getPredictionController } from '../controllers/predictions/getPredictionController';
import { updatePredictionController } from '../controllers/predictions/updatePredictionController';
import { predictionSchemas } from '../schemas/prediction.schemas';

export async function PredictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/predictions', {
    schema: {
      tags: ['Predictions'],
      summary: 'Create a new prediction',
      description: 'Creates a new prediction for a specific match in a pool',
      body: predictionSchemas.CreatePredictionRequest,
      response: {
        201: {
          description: 'Prediction created successfully',
          type: 'object',
          properties: {
            prediction: predictionSchemas.Prediction,
          },
        },
        401: {
          description: 'Unauthorized to create prediction',
          ...predictionSchemas.UnauthorizedError,
        },
        400: {
          description: 'Match has already started or prediction already exists',
          oneOf: [
            predictionSchemas.MatchAlreadyStartedError,
            predictionSchemas.PredictionAlreadyExistsError
          ],
        },
        403: {
          description: 'User is not a member of this pool',
          ...predictionSchemas.NotPoolMemberError,
        },
        404: {
          description: 'Pool or match not found',
          oneOf: [
            predictionSchemas.PoolNotFoundError,
            predictionSchemas.MatchNotFoundError,
          ],
        },
        422: {
          description: 'Validation error',
          ...predictionSchemas.PredictionValidationError,
        },
        500: {
          description: 'Internal server error',
          ...predictionSchemas.PredictionInternalServerError,
        },
      },
    },
  }, createPredictionController);

  app.get('/predictions/:predictionId', {
    schema: {
      tags: ['Predictions'],
      summary: 'Get prediction details',
      description: 'Retrieves detailed information about a specific prediction',
      params: predictionSchemas.PredictionIdParam,
      response: {
        200: {
          description: 'Prediction retrieved successfully',
          type: 'object',
          properties: {
            prediction: {
              allOf: [
                predictionSchemas.Prediction,
                {
                  type: 'object',
                  properties: {
                    match: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        matchDatetime: { type: 'string', format: 'date-time' },
                        stadium: { type: 'string', nullable: true },
                        stage: { type: 'string' },
                        group: { type: 'string', nullable: true },
                        homeTeam: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            flagUrl: { type: 'string', nullable: true }
                          }
                        },
                        awayTeam: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            flagUrl: { type: 'string', nullable: true }
                          }
                        }
                      }
                    },
                    pool: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              ]
            }
          }
        },
        401: {
          description: 'Unauthorized to access this prediction',
          ...predictionSchemas.UnauthorizedError
        },
        404: {
          description: 'Prediction not found',
          ...predictionSchemas.PredictionNotFoundError
        },
        422: {
          description: 'Validation error',
          ...predictionSchemas.PredictionValidationError
        },
        500: {
          description: 'Internal server error',
          ...predictionSchemas.PredictionInternalServerError
        }
      }
    }
  }, getPredictionController);

  app.put('/predictions/:predictionId', {
    schema: {
      tags: ['Predictions'],
      summary: 'Update prediction',
      description: 'Updates an existing prediction (only allowed before match starts)',
      params: predictionSchemas.PredictionIdParam,
      body: predictionSchemas.UpdatePredictionRequest,
      response: {
        200: {
          description: 'Prediction updated successfully',
          type: 'object',
          properties: {
            prediction: predictionSchemas.Prediction
          }
        },
        400: {
          description: 'Match has already started',
          ...predictionSchemas.MatchAlreadyStartedError
        },
        401: {
          description: 'Unauthorized to update this prediction',
          ...predictionSchemas.UnauthorizedError
        },
        404: {
          description: 'Prediction not found',
          ...predictionSchemas.PredictionNotFoundError
        },
        422: {
          description: 'Validation error',
          ...predictionSchemas.PredictionValidationError
        },
        500: {
          description: 'Internal server error',
          ...predictionSchemas.PredictionInternalServerError
        }
      }
    }
  }, updatePredictionController);
}
