import { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verifyJWT';

import { getTournamentMatchesController } from '../controllers/tournaments/getTournamentMatchesController';
import { listTournamentsController } from '../controllers/tournaments/listTournamentsController';
import { tournamentSchemas } from '../schemas/tournament.schemas';

export function tournamentsRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifyJwt);

  app.get(
    '/tournaments',
    {
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
                items: tournamentSchemas.TournamentWithStats,
              },
              total: { type: 'number' },
            },
          },
          401: tournamentSchemas.UnauthorizedError,
          500: tournamentSchemas.InternalServerError,
        },
      },
    },
    listTournamentsController
  );

  app.get(
    '/tournaments/:tournamentId/matches',
    {
      schema: {
        tags: ['Tournaments'],
        summary: 'Get tournament matches',
        description:
          'Retrieves all matches for a specific tournament with optional filtering by stage, status, or group',
        params: tournamentSchemas.TournamentIdParam,
        querystring: tournamentSchemas.TournamentMatchesQuery,
        response: {
          200: {
            description: 'Tournament matches retrieved successfully',
            type: 'object',
            properties: {
              matches: {
                type: 'array',
                items: tournamentSchemas.TournamentMatch,
              },
            },
            required: ['matches'],
          },
          404: tournamentSchemas.TournamentNotFoundError,
          422: tournamentSchemas.ValidationError,
          500: tournamentSchemas.InternalServerError,
        },
      },
    },
    getTournamentMatchesController
  );
}
