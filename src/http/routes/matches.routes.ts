import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { getMatchController } from '../controllers/matches/getMatchController';
import { getMatchPredictions } from '../controllers/matches/getMatchPredictionsController';
import { updateMatchController } from '../controllers/matches/updateMatchController';
import { matchSchemas } from '../schemas/match.schemas';

export async function matchesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get('/matches/:matchId', {
    schema: {
      tags: ['Matches'],
      summary: 'Get match details',
      description: 'Retrieves detailed information about a specific match including team details and tournament information',
      params: matchSchemas.MatchIdParam,
      response: {
        200: {
          description: 'Match information retrieved successfully',
          type: 'object',
          properties: {
            match: matchSchemas.MatchWithTeams
          }
        },
        404: {
          description: 'Match not found',
          ...matchSchemas.MatchNotFoundError
        },
        422: {
          description: 'Validation error',
          ...matchSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...matchSchemas.InternalServerError
        }
      }
    }
  }, getMatchController);

  app.get('/matches/:matchId/predictions', {
    schema: {
      tags: ['Matches'],
      summary: 'Get match predictions',
      description: 'Retrieves all predictions made for a specific match across all pools the user has access to',
      params: matchSchemas.MatchIdParam,
      response: {
        200: {
          description: 'Match predictions retrieved successfully',
          type: 'object',
          properties: {
            predictions: {
              type: 'array',
              items: matchSchemas.MatchPrediction
            },
            match: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                matchDatetime: { type: 'string', format: 'date-time' },
                stadium: { type: 'string', nullable: true },
                stage: { type: 'string' },
                matchStatus: { type: 'string' },
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
            totalPredictions: { type: 'number' }
          }
        },
        404: {
          description: 'Match not found',
          ...matchSchemas.MatchNotFoundError
        },
        422: {
          description: 'Validation error',
          ...matchSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...matchSchemas.InternalServerError
        }
      }
    }
  }, getMatchPredictions);

  app.put('/matches/:matchId', {
    schema: {
      tags: ['Matches'],
      summary: 'Update match information',
      description: 'Updates match details including scores, status, and other match information (admin only)',
      params: matchSchemas.MatchIdParam,
      body: matchSchemas.UpdateMatchRequest,
      response: {
        200: {
          description: 'Match updated successfully',
          type: 'object',
          properties: {
            match: matchSchemas.MatchWithTeams
          }
        },
        401: {
          description: 'Unauthorized access',
          ...matchSchemas.UnauthorizedError
        },
        403: {
          description: 'Insufficient permissions to update match',
          ...matchSchemas.ForbiddenError
        },
        404: {
          description: 'Match not found',
          ...matchSchemas.MatchNotFoundError
        },
        422: {
          description: 'Validation error',
          ...matchSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...matchSchemas.InternalServerError
        }
      }
    }
  }, updateMatchController);
}
