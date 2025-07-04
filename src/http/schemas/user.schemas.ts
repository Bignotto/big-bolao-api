export const userSchemas = {
  // Base User object
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'User unique identifier (CUID)' },
      fullName: { type: 'string', description: 'User full name' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      profileImageUrl: { type: 'string', nullable: true, description: 'User profile image URL' },
      createdAt: { type: 'string', format: 'date-time', description: 'User creation timestamp' },
      lastLogin: { type: 'string', format: 'date-time', nullable: true, description: 'Last login timestamp' },
      accountProvider: {
        type: 'string',
        enum: ['GOOGLE', 'APPLE', 'EMAIL'],
        description: 'Account provider type'
      },
      role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
        description: 'User role'
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
        default: 'EMAIL'
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
      user: { $ref: '#/components/schemas/User' },
    },
  },

  // Get User Info Response
  GetUserInfoResponse: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
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

  // Pool object for user pools response
  Pool: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Pool unique identifier' },
      title: { type: 'string', description: 'Pool title' },
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
        items: { $ref: '#/components/schemas/Pool' },
      },
    },
  },

  // Prediction object
  Prediction: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Prediction unique identifier' },
      userId: { type: 'string', description: 'User ID who made the prediction' },
      matchId: { type: 'number', description: 'Match ID' },
      poolId: { type: 'number', description: 'Pool ID' },
      homeTeamScore: { type: 'number', description: 'Predicted home team score' },
      awayTeamScore: { type: 'number', description: 'Predicted away team score' },
      points: { type: 'number', description: 'Points earned from this prediction' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
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
        items: { $ref: '#/components/schemas/Prediction' },
      },
    },
  },

  // Standing object
  Standing: {
    type: 'object',
    properties: {
      userId: { type: 'string', description: 'User ID' },
      poolId: { type: 'number', description: 'Pool ID' },
      poolTitle: { type: 'string', description: 'Pool title' },
      userName: { type: 'string', description: 'User name' },
      userAvatar: { type: 'string', description: 'User avatar URL' },
      totalPoints: { type: 'number', description: 'Total points earned' },
      position: { type: 'number', description: 'Current position in the pool' },
      correctPredictions: { type: 'number', description: 'Number of correct predictions' },
      totalPredictions: { type: 'number', description: 'Total number of predictions made' },
    },
  },

  // Get User Pool Standings Response
  GetUserPoolStandingsResponse: {
    type: 'object',
    properties: {
      standing: {
        type: 'array',
        items: { $ref: '#/components/schemas/Standing' },
      },
    },
  },

  // Error responses
  ValidationError: {
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

  InternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error.' },
    },
  },
};
