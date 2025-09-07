import { FastifyInstance } from 'fastify';

import { getTournamentMatchesController } from '@/http/controllers/tournaments/getTournamentMatchesController';
import { listTournamentsController } from '@/http/controllers/tournaments/listTournamentsController';
import { verifySupabaseToken } from '@/http/middlewares/verifySupabaseToken';
import { matchSchemas } from '@/http/schemas/match.schemas';
import { commonSchemas } from '@/http/schemas/common.schemas';
import { tournamentSchemas } from '@/http/schemas/tournament.schemas';

export function tournamentsRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifySupabaseToken);

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
          401: commonSchemas.UnauthorizedError,
          500: tournamentSchemas.TournamentInternalServerError,
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
                items: matchSchemas.Match,
              },
            },
            required: ['matches'],
          },
          401: commonSchemas.UnauthorizedError,
          404: tournamentSchemas.TournamentNotFoundError,
          422: tournamentSchemas.TournamentValidationError,
          500: tournamentSchemas.TournamentInternalServerError,
        },
      },
    },
    getTournamentMatchesController
  );
}
