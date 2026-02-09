import type { OpenAPIV3 } from 'openapi-types';

export const userSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  // Base User object
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'User unique identifier (CUID)' },
      fullName: { type: 'string', description: 'User full name' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      profileImageUrl: { type: 'string', nullable: true, description: 'User profile image URL' },
      createdAt: { type: 'string', format: 'date-time', description: 'User creation timestamp' },
      lastLogin: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Last login timestamp',
      },
      accountProvider: {
        type: 'string',
        enum: ['GOOGLE', 'APPLE', 'EMAIL'],
        description: 'Account provider type',
      },
      role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
        description: 'User role',
      },
    },
    required: ['id', 'fullName', 'email', 'createdAt'],
  },

  // Create User Request Body
  CreateUserRequest: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'User ID (optional, will be generated if not provided)' },
      fullName: { type: 'string', description: 'User full name' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      passwordHash: { type: 'string', description: 'User password hash' },
      profileImageUrl: { type: 'string', description: 'User profile image URL' },
      accountProvider: {
        type: 'string',
        enum: ['GOOGLE', 'APPLE', 'EMAIL'],
        description: 'Account provider type',
        default: 'EMAIL',
      },
    },
    required: ['fullName', 'email', 'passwordHash', 'profileImageUrl'],
    additionalProperties: false,
  },

  // Create User Response
  CreateUserResponse: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          profileImageUrl: { type: 'string' },
        },
      },
    },
  },

  // Update User Request Body
  UpdateUserRequest: {
    type: 'object',
    properties: {
      fullName: { type: 'string', description: 'User full name' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      profileImageUrl: { type: 'string', description: 'User profile image URL' },
    },
    required: [],
    additionalProperties: false,
  },

  // Update User Response
  UpdateUserResponse: {
    type: 'object',
    properties: {
      user: { $ref: 'User#' },
    },
  },

  // Get User Info Response
  GetUserInfoResponse: {
    type: 'object',
    properties: {
      user: { $ref: 'User#' },
    },
  },

  // User ID Parameter
  UserIdParam: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User unique identifier',
        // pattern: '^[a-z0-9]{25}$' // Uncomment if using CUID validation
      },
    },
    required: ['userId'],
  },

  // UserPool object for user pools response
  UserPool: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Pool unique identifier' },
      name: { type: 'string', description: 'Pool name' },
      code: { type: 'string', description: 'Pool invitation code' },
      ownerId: { type: 'string', description: 'Pool owner user ID' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      participantCount: { type: 'number', description: 'Number of participants' },
    },
  },

  // Get User Pools Response
  GetUserPoolsResponse: {
    type: 'object',
    properties: {
      pools: {
        type: 'array',
        items: { $ref: 'UserPool#' },
      },
    },
  },

  // Get User Predictions Query Parameters
  GetUserPredictionsQuery: {
    type: 'object',
    properties: {
      poolId: {
        type: 'number',
        minimum: 1,
        description: 'Optional pool ID to filter predictions',
      },
    },
  },

  // Get User Predictions Response
  GetUserPredictionsResponse: {
    type: 'object',
    properties: {
      predictions: {
        type: 'array',
        items: { $ref: 'Prediction#' },
      },
    },
  },

  // Standing object
  Standing: {
    type: 'object',
    properties: {
      ranking: { type: 'number', description: 'Current position in the pool' },
      fullName: { type: 'string', description: 'User name' },
      profileImageUrl: { type: 'string', description: 'User avatar URL' },
      userId: { type: 'string', description: 'User ID' },
      poolId: { type: 'number', description: 'Pool ID' },
      totalPredictions: { type: 'number', description: 'Total predictions made' },
      totalPoints: { type: 'number', description: 'Total points earned' },
      exactScoreCount: { type: 'number', description: 'Number of correct predictions' },
      pointsRatio: {
        type: 'number',
        description: `The user's score as a percentage of the total possible score.`,
      },
      guessRatio: {
        type: 'number',
        description: `The percentage of the user's correct guesses relative to the total number of matches to be predicted.`,
      },
      predictionsRatio: {
        type: 'number',
        description: `The percentage of predictions the user has submitted out of the total number of matches to be predicted.`,
      },
    },
  },

  // Get User Pool Standings Response
  GetUserPoolStandingsResponse: {
    type: 'object',
    properties: {
      standing: {
        type: 'array',
        items: { $ref: 'Standing#' },
      },
    },
  },

  // Error responses
  UserValidationError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Validation error' },
      issues: {
        type: 'object',
        description: 'Detailed validation issues',
      },
    },
  },

  EmailInUseError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Email already in use' },
    },
  },

  ResourceNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Resource not found' },
    },
  },

  NotParticipantError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'User is not a participant of this pool' },
    },
  },

  UserInternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error.' },
    },
  },
};
