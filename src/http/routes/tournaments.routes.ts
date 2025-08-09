import { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verifyJWT';

import { getTournamentMatchesController } from '../controllers/tournaments/getTournamentMatchesController';
import { listTournamentsController } from '../controllers/tournaments/listTournamentsController';
import { matchSchemas } from '../schemas/match.schemas';

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
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    logoUrl: { type: 'string', nullable: true },
                    status: { type: 'string', enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    totalMatches: { type: 'number' },
                    completedMatches: { type: 'number' },
                    totalTeams: { type: 'number' },
                    totalPools: { type: 'number' },
                  },
                  required: ['id', 'name', 'startDate', 'endDate', 'status', 'createdAt'],
                },
              },
              total: { type: 'number' },
            },
          },
          401: {
            description: 'Unauthorized access',
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Unauthorized' },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Internal server error' },
            },
          },
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
        params: {
          type: 'object',
          properties: {
            tournamentId: { type: 'string', pattern: '^[0-9]+$' },
          },
          required: ['tournamentId'],
          additionalProperties: false,
        },
        querystring: {
          type: 'object',
          properties: {
            stage: {
              type: 'string',
              enum: ['GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'THIRD_PLACE', 'LOSERS_MATCH'],
            },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED'],
            },
            group: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
          additionalProperties: false,
        },
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
          404: {
            description: 'Tournament not found',
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Tournament not found' },
            },
          },
          422: {
            description: 'Validation error',
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation error' },
              issues: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
          500: {
            description: 'Internal server error',
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Internal server error' },
            },
          },
        },
      },
    },
    getTournamentMatchesController
  );
}
