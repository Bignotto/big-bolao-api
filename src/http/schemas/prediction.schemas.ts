export const predictionSchemas = {
  // Base Prediction schema
  Prediction: {
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
      pointsEarned: { type: 'number', nullable: true }
    },
    required: ['id', 'poolId', 'matchId', 'userId', 'predictedHomeScore', 'predictedAwayScore', 'submittedAt']
  },

  // Request schemas
  CreatePredictionRequest: {
    type: 'object',
    properties: {
      poolId: { type: 'number' },
      matchId: { type: 'number' },
      predictedHomeScore: { type: 'number', minimum: 0 },
      predictedAwayScore: { type: 'number', minimum: 0 },
      predictedHasExtraTime: { type: 'boolean', default: false },
      predictedHasPenalties: { type: 'boolean', default: false },
      predictedPenaltyHomeScore: { type: 'number', minimum: 0, nullable: true },
      predictedPenaltyAwayScore: { type: 'number', minimum: 0, nullable: true }
    },
    required: ['poolId', 'matchId', 'predictedHomeScore', 'predictedAwayScore'],
    additionalProperties: false
  },

  UpdatePredictionRequest: {
    type: 'object',
    properties: {
      predictedHomeScore: { type: 'number', minimum: 0 },
      predictedAwayScore: { type: 'number', minimum: 0 },
      predictedHasExtraTime: { type: 'boolean' },
      predictedHasPenalties: { type: 'boolean' },
      predictedPenaltyHomeScore: { type: 'number', minimum: 0, nullable: true },
      predictedPenaltyAwayScore: { type: 'number', minimum: 0, nullable: true }
    },
    additionalProperties: false
  },

  // Parameter schemas
  PredictionIdParam: {
    type: 'object',
    properties: {
      predictionId: { type: 'string', pattern: '^[0-9]+$' }
    },
    required: ['predictionId'],
    additionalProperties: false
  },

  // Error schemas
  PredictionValidationError: {
    type: 'object',
    properties: {
      message: { type: 'string' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  },

  PredictionNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Prediction not found' }
    }
  },

  MatchNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Match not found' }
    }
  },

  PoolNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Pool not found' }
    }
  },

  NotPoolMemberError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'User is not a member of this pool' }
    }
  },

  PredictionAlreadyExistsError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Prediction already exists for this match' }
    }
  },

  MatchAlreadyStartedError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Cannot create/update prediction for a match that has already started' }
    }
  },

  UnauthorizedError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Unauthorized to access this prediction' }
    }
  },

  PredictionInternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error' }
    }
  }
};
