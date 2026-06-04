import { FastifyInstance } from 'fastify';

import { getTournamentDetailController } from '@/http/controllers/tournaments/getTournamentDetailController';
import { getTournamentMatchesController } from '@/http/controllers/tournaments/getTournamentMatchesController';
import { listTournamentsController } from '@/http/controllers/tournaments/listTournamentsController';
import { verifySupabaseToken } from '@/http/middlewares/verifySupabaseToken';
import { verifyUserOrSyncSecret } from '@/http/middlewares/verifyUserOrSyncSecret';
import { commonSchemas } from '@/http/schemas/common.schemas';
import { tournamentSchemas } from '@/http/schemas/tournament.schemas';

export function tournamentsRoutes(app: FastifyInstance): void {
  // /tournaments and /tournaments/:tournamentId require a Supabase token
  app.register((scoped) => {
    scoped.addHook('onRequest', verifySupabaseToken);

    scoped.get(
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

    scoped.get(
      '/tournaments/:tournamentId',
      {
        schema: {
          tags: ['Tournaments'],
          summary: 'Get tournament details',
          description: 'Retrieves tournament metadata and basic statistics',
          params: tournamentSchemas.TournamentIdParam,
          response: {
            200: {
              description: 'Tournament details retrieved successfully',
              type: 'object',
              properties: {
                tournament: tournamentSchemas.TournamentWithStats,
              },
              required: ['tournament'],
            },
            401: commonSchemas.UnauthorizedError,
            404: tournamentSchemas.TournamentNotFoundError,
            422: tournamentSchemas.TournamentValidationError,
            500: tournamentSchemas.TournamentInternalServerError,
          },
        },
      },
      getTournamentDetailController
    );
  });

  // /tournaments/:tournamentId/matches accepts a Supabase token (any user) or SYNC_API_SECRET
  app.get(
    '/tournaments/:tournamentId/matches',
    {
      preHandler: [verifyUserOrSyncSecret],
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
                items: { $ref: 'MatchWithTeams#' },
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
