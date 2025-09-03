import { FastifyInstance } from 'fastify';

import { getMatchController } from '@/http/controllers/matches/getMatchController';
import { getMatchPredictionsController } from '@/http/controllers/matches/getMatchPredictionsController';
import { updateMatchController } from '@/http/controllers/matches/updateMatchController';
import { verifyJwt } from '@/http/middlewares/verifyJwt';
import { commonSchemas } from '@/http/schemas/common.schemas';
import { matchSchemas } from '@/http/schemas/match.schemas';

export function matchesRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifyJwt);

  app.get(
    '/matches/:matchId',
    {
      schema: {
        tags: ['Matches'],
        summary: 'Get match details',
        description:
          'Retrieves detailed information about a specific match including team details and tournament information',
        params: matchSchemas.MatchIdParam,
        response: {
          200: {
            description: 'Match information retrieved successfully',
            ...matchSchemas.GetMatchResponse,
          },
          401: {
            description: 'Unauthorized access',
            ...commonSchemas.UnauthorizedError,
          },
          404: {
            description: 'Match not found',
            ...commonSchemas.MatchNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...matchSchemas.MatchValidationError,
          },
          500: {
            description: 'Internal server error',
            ...matchSchemas.MatchInternalServerError,
          },
        },
      },
    },
    getMatchController
  );

  app.get(
    '/matches/:matchId/predictions',
    {
      schema: {
        tags: ['Matches'],
        summary: 'Get match predictions',
        description:
          'Retrieves all predictions made for a specific match across all pools the user has access to',
        params: matchSchemas.MatchIdParam,
        response: {
          200: {
            description: 'Match predictions retrieved successfully',
            ...matchSchemas.GetMatchPredictionsResponse,
          },
          401: {
            description: 'Unauthorized access',
            ...commonSchemas.UnauthorizedError,
          },
          404: {
            description: 'Match not found',
            ...commonSchemas.MatchNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...matchSchemas.MatchValidationError,
          },
          500: {
            description: 'Internal server error',
            ...matchSchemas.MatchInternalServerError,
          },
        },
      },
    },
    getMatchPredictionsController
  );

  app.put(
    '/matches/:matchId',
    {
      schema: {
        tags: ['Matches'],
        summary: 'Update match information',
        description:
          'Updates match details including scores, status, and other match information (admin only)',
        params: matchSchemas.MatchIdParam,
        body: matchSchemas.UpdateMatchRequest,
        response: {
          200: {
            description: 'Match updated successfully',
            ...matchSchemas.UpdateMatchResponse,
          },
          401: {
            description: 'Unauthorized access',
            ...commonSchemas.UnauthorizedError,
          },
          403: {
            description: 'Insufficient permissions to update match',
            ...matchSchemas.ForbiddenError,
          },
          404: {
            description: 'Match not found',
            ...commonSchemas.MatchNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...matchSchemas.MatchValidationError,
          },
          500: {
            description: 'Internal server error',
            ...matchSchemas.MatchInternalServerError,
          },
        },
      },
    },
    updateMatchController
  );
}
