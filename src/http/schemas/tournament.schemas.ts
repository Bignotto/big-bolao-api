import type { OpenAPIV3 } from 'openapi-types';

export const tournamentSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Base Tournament schema
  Tournament: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      logoUrl: { type: 'string', nullable: true },
      status: {
        type: 'string',
        enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
      },
      createdAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'startDate', 'endDate', 'status', 'createdAt'],
  },

  // Tournament with additional stats
  TournamentWithStats: {
    allOf: [
      { $ref: 'Tournament#' }, // Use simple reference for Fastify
      {
        type: 'object',
        properties: {
          totalMatches: { type: 'number' },
          completedMatches: { type: 'number' },
          totalTeams: { type: 'number' },
          totalPools: { type: 'number' },
        },
      },
    ],
  },

  // Tournament Team schema
  TournamentTeam: {
    type: 'object',
    properties: {
      tournamentId: { type: 'number' },
      teamId: { type: 'number' },
      groupName: { type: 'string', nullable: true },
      team: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          countryCode: { type: 'string', nullable: true },
          flagUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'name'],
      },
    },
    required: ['tournamentId', 'teamId', 'team'],
  },

  // Tournament Match schema
  TournamentMatch: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      tournamentId: { type: 'number' },
      homeTeamId: { type: 'number' },
      awayTeamId: { type: 'number' },
      matchDatetime: { type: 'string', format: 'date-time' },
      stadium: { type: 'string', nullable: true },
      stage: {
        type: 'string',
        enum: [
          'GROUP',
          'ROUND_OF_16',
          'QUARTER_FINAL',
          'SEMI_FINAL',
          'FINAL',
          'THIRD_PLACE',
          'LOSERS_MATCH',
        ],
      },
      group: { type: 'string', nullable: true },
      homeTeamScore: { type: 'number', nullable: true },
      awayTeamScore: { type: 'number', nullable: true },
      matchStatus: {
        type: 'string',
        enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED'],
      },
      hasExtraTime: { type: 'boolean' },
      hasPenalties: { type: 'boolean' },
      penaltyHomeScore: { type: 'number', nullable: true },
      penaltyAwayScore: { type: 'number', nullable: true },
      homeTeam: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          countryCode: { type: 'string', nullable: true },
          flagUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'name'],
      },
      awayTeam: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          countryCode: { type: 'string', nullable: true },
          flagUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'name'],
      },
    },
    required: [
      'id',
      'tournamentId',
      'homeTeamId',
      'awayTeamId',
      'matchDatetime',
      'stage',
      'matchStatus',
      'hasExtraTime',
      'hasPenalties',
      'homeTeam',
      'awayTeam',
    ],
  },

  // Parameter schemas
  TournamentIdParam: {
    type: 'object',
    properties: {
      tournamentId: { type: 'string', pattern: '^[0-9]+$' },
    },
    required: ['tournamentId'],
    additionalProperties: false,
  },

  // Query parameters for matches
  TournamentMatchesQuery: {
    type: 'object',
    properties: {
      stage: {
        type: 'string',
        enum: [
          'GROUP',
          'ROUND_OF_16',
          'QUARTER_FINAL',
          'SEMI_FINAL',
          'FINAL',
          'THIRD_PLACE',
          'LOSERS_MATCH',
        ],
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

  // Error schemas - only unique ones
  TournamentNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Tournament not found' },
    },
  },

  TournamentValidationError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Validation error' },
      issues: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },

  TournamentInternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error' },
    },
  },
};
