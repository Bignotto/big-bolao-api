import { verifyJwt } from '@/http/middlewares/verifyJWT';
import { FastifyInstance } from 'fastify';
import { getTournamentMatchesController } from '../controllers/tournaments/getTournamentMatchesController';
import { listTournamentsController } from '../controllers/tournaments/listTournamentsController';
import { tournamentSchemas } from '../schemas/tournament.schemas';

export async function tournamentsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.get('/tournaments', {
    schema: {
      tags: ['Tournaments'],
      summary: 'List all tournaments',
      description: 'Retrieves a list of all tournaments with basic statistics',
      response: {
        200: {
          description: 'Tournaments retrieved successfully',
          type: 'object',
          properties: {
            tournaments: {
              type: 'array',
              items: tournamentSchemas.TournamentWithStats
            },
            total: { type: 'number' }
          }
        },
        401: {
          description: 'Unauthorized access',
          ...tournamentSchemas.UnauthorizedError
        },
        500: {
          description: 'Internal server error',
          ...tournamentSchemas.InternalServerError
        }
      }
    }
  }, listTournamentsController);

  app.get('/tournaments/:tournamentId/matches', {
    schema: {
      tags: ['Tournaments'],
      summary: 'Get tournament matches',
      description: 'Retrieves all matches for a specific tournament with optional filtering by stage, status, or group',
      params: tournamentSchemas.TournamentIdParam,
      querystring: tournamentSchemas.TournamentMatchesQuery,
      response: {
        200: {
          description: 'Tournament matches retrieved successfully',
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: tournamentSchemas.TournamentMatch
            },
            tournament: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                logoUrl: { type: 'string', nullable: true },
                status: { type: 'string' }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            },
            filters: {
              type: 'object',
              properties: {
                stage: { type: 'string', nullable: true },
                status: { type: 'string', nullable: true },
                group: { type: 'string', nullable: true }
              }
            }
          }
        },
        404: {
          description: 'Tournament not found',
          ...tournamentSchemas.TournamentNotFoundError
        },
        422: {
          description: 'Validation error',
          ...tournamentSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...tournamentSchemas.InternalServerError
        }
      }
    }
  }, getTournamentMatchesController);
}
