export const matchSchemas = {
  // Base Match schema
  Match: {
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
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time', nullable: true },
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
      'createdAt',
    ],
  },

  // Extended Match with team details
  MatchWithTeams: {
    allOf: [
      { $ref: 'Match#' }, // Back to original reference
      {
        type: 'object',
        properties: {
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
          tournament: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              logoUrl: { type: 'string', nullable: true },
            },
            required: ['id', 'name'],
          },
        },
      },
    ],
  },

  // Match Prediction schema
  MatchPrediction: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      poolId: { type: 'number' },
      matchId: { type: 'number' },
      userId: { type: 'string' },
      predictedHomeScore: { type: 'number' },
      predictedAwayScore: { type: 'number' },
      predictedHasExtraTime: { type: 'boolean' },
      predictedHasPenalties: { type: 'boolean' },
      predictedPenaltyHomeScore: { type: 'number', nullable: true },
      predictedPenaltyAwayScore: { type: 'number', nullable: true },
      submittedAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time', nullable: true },
      pointsEarned: { type: 'number', nullable: true },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          profileImageUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'fullName'],
      },
      pool: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      },
    },
    required: [
      'id',
      'poolId',
      'matchId',
      'userId',
      'predictedHomeScore',
      'predictedAwayScore',
      'submittedAt',
      'user',
      'pool',
    ],
  },

  // Request schemas
  UpdateMatchRequest: {
    type: 'object',
    properties: {
      homeTeamScore: { type: 'number', minimum: 0, nullable: true },
      awayTeamScore: { type: 'number', minimum: 0, nullable: true },
      matchStatus: {
        type: 'string',
        enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED'],
      },
      hasExtraTime: { type: 'boolean' },
      hasPenalties: { type: 'boolean' },
      penaltyHomeScore: { type: 'number', minimum: 0, nullable: true },
      penaltyAwayScore: { type: 'number', minimum: 0, nullable: true },
      matchDatetime: { type: 'string', format: 'date-time' },
      stadium: { type: 'string', nullable: true },
    },
    additionalProperties: false,
  },

  // Parameter schemas
  MatchIdParam: {
    type: 'object',
    properties: {
      matchId: { type: 'string', pattern: '^[0-9]+$' },
    },
    required: ['matchId'],
    additionalProperties: false,
  },

  // Error schemas - Remove duplicates, keep only unique ones
  MatchNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Match not found' },
    },
  },

  ForbiddenError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Insufficient permissions to update match' },
    },
  },

  ValidationError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Validation error' },
      issues: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },

  UnauthorizedError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Unauthorized' },
    },
  },

  InternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error' },
    },
  },

  // Response schemas for matches endpoints
  GetMatchResponse: {
    type: 'object',
    properties: {
      match: { $ref: 'MatchWithTeams#' },
    },
  },

  GetMatchPredictionsResponse: {
    type: 'object',
    properties: {
      predictions: {
        type: 'array',
        items: { $ref: 'MatchPrediction#' },
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
              flagUrl: { type: 'string', nullable: true },
            },
          },
          awayTeam: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              flagUrl: { type: 'string', nullable: true },
            },
          },
        },
      },
      totalPredictions: { type: 'number' },
    },
  },

  UpdateMatchResponse: {
    type: 'object',
    properties: {
      match: { $ref: 'MatchWithTeams#' },
    },
  },
};
