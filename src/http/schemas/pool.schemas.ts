export const poolSchemas = {
  // Base Pool object
  Pool: {
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Pool unique identifier' },
      name: { type: 'string', description: 'Pool name' }, // Changed from 'title' to 'name'
      description: { type: 'string', nullable: true, description: 'Pool description' },
      tournamentId: { type: 'number', description: 'Tournament ID this pool belongs to' },
      creatorId: { type: 'string', description: 'Pool creator user ID' },
      isPrivate: { type: 'boolean', description: 'Whether the pool is private' },
      inviteCode: { type: 'string', nullable: true, description: 'Pool invitation code' },
      maxParticipants: { type: 'number', nullable: true, description: 'Maximum number of participants' },
      registrationDeadline: { type: 'string', format: 'date-time', nullable: true, description: 'Registration deadline' },
      createdAt: { type: 'string', format: 'date-time', description: 'Pool creation timestamp' },
      creator: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          profileImageUrl: { type: 'string', nullable: true },
        },
        description: 'Pool creator information'
      },
      tournament: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: {
            type: 'string',
            enum: ['UPCOMING', 'ACTIVE', 'COMPLETED']
          },
        },
        description: 'Tournament information'
      },
      participantCount: { type: 'number', description: 'Number of participants in the pool' },
    },
    required: ['id', 'name', 'tournamentId', 'creatorId', 'isPrivate', 'createdAt'],
  },

  // Create Pool Request Body
  CreatePoolRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Pool name'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Pool description (optional)'
      },
      tournamentId: {
        type: 'number',
        description: 'Tournament ID this pool is associated with'
      },
      isPrivate: {
        type: 'boolean',
        description: 'Whether the pool is private (requires invitation code)',
        default: false
      },
      maxParticipants: {
        type: 'number',
        minimum: 2,
        maximum: 1000,
        description: 'Maximum number of participants allowed in the pool (optional)'
      },
      registrationDeadline: {
        type: 'string',
        format: 'date-time',
        description: 'Registration deadline (optional)'
      },
    },
    required: ['name', 'tournamentId'],
    additionalProperties: false,
  },

  // Create Pool Response
  CreatePoolResponse: {
    type: 'object',
    properties: {
      pool: { $ref: '#/components/schemas/Pool' },
    },
  },

  // Pool ID Parameter
  PoolIdParam: {
    type: 'object',
    properties: {
      poolId: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Pool unique identifier'
      },
    },
    required: ['poolId'],
  },

  // Get Pool Response
  GetPoolResponse: {
    type: 'object',
    properties: {
      pool: { $ref: '#/components/schemas/Pool' },
    },
  },

  // Join Pool Request Body
  JoinPoolRequest: {
    type: 'object',
    properties: {
      inviteCode: {
        type: 'string',
        minLength: 1,
        description: 'Pool invitation code'
      },
    },
    required: ['inviteCode'],
    additionalProperties: false,
  },

  // Join Pool Response
  JoinPoolResponse: {
    type: 'object',
    properties: {
      pool: { $ref: '#/components/schemas/Pool' },
    },
  },

  // Leave Pool Response
  LeavePoolResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Successfully left the pool'
      },
    },
  },

  // Remove User from Pool Parameters
  RemoveUserFromPoolParams: {
    type: 'object',
    properties: {
      poolId: {
        type: 'string',
        pattern: '^[0-9]+$',
        description: 'Pool unique identifier'
      },
      userId: {
        type: 'string',
        description: 'User unique identifier to remove'
      },
    },
    required: ['poolId', 'userId'],
  },

  // Remove User from Pool Response
  RemoveUserFromPoolResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'User successfully removed from pool'
      },
    },
  },

  // Pool User object
  PoolUser: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'User unique identifier' },
      fullName: { type: 'string', description: 'User full name' },
      profileImageUrl: { type: 'string', description: 'User profile image URL' },
      joinedAt: { type: 'string', format: 'date-time', description: 'When user joined the pool' },
      isOwner: { type: 'boolean', description: 'Whether user is the pool owner' },
    },
  },

  // Get Pool Users Response
  GetPoolUsersResponse: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: { $ref: '#/components/schemas/PoolUser' },
      },
      count: { type: 'number', description: 'Total number of users in the pool' },
    },
  },

  // Update Pool Request Body
  UpdatePoolRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Pool name'
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Pool description'
      },
      isPrivate: {
        type: 'boolean',
        description: 'Whether the pool is private'
      },
      maxParticipants: {
        type: 'number',
        minimum: 2,
        maximum: 1000,
        description: 'Maximum number of participants allowed'
      },
      registrationDeadline: {
        type: 'string',
        format: 'date-time',
        description: 'Registration deadline'
      },
    },
    required: [],
    additionalProperties: false,
  },

  // Update Pool Response
  UpdatePoolResponse: {
    type: 'object',
    properties: {
      pool: { $ref: '#/components/schemas/Pool' },
    },
  },

  // Pool Prediction object
  PoolPrediction: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Prediction unique identifier' },
      userId: { type: 'string', description: 'User ID who made the prediction' },
      matchId: { type: 'number', description: 'Match ID' },
      homeTeamScore: { type: 'number', description: 'Predicted home team score' },
      awayTeamScore: { type: 'number', description: 'Predicted away team score' },
      points: { type: 'number', description: 'Points earned from this prediction' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          profileImageUrl: { type: 'string' },
        },
      },
      match: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          homeTeamScore: { type: 'number', nullable: true },
          awayTeamScore: { type: 'number', nullable: true },
        },
      },
    },
  },

  // Get Pool Predictions Response
  GetPoolPredictionsResponse: {
    type: 'object',
    properties: {
      predictions: {
        type: 'array',
        items: { $ref: '#/components/schemas/PoolPrediction' },
      },
    },
  },

  // Pool Standing object
  PoolStanding: {
    type: 'object',
    properties: {
      position: { type: 'number', description: 'Current position in the pool' },
      userId: { type: 'string', description: 'User ID' },
      userName: { type: 'string', description: 'User name' },
      userAvatar: { type: 'string', description: 'User avatar URL' },
      totalPoints: { type: 'number', description: 'Total points earned' },
      correctPredictions: { type: 'number', description: 'Number of correct predictions' },
      totalPredictions: { type: 'number', description: 'Total number of predictions made' },
      accuracy: { type: 'number', description: 'Prediction accuracy percentage' },
    },
  },

  // Get Pool Standings Response
  GetPoolStandingsResponse: {
    type: 'object',
    properties: {
      standings: {
        type: 'array',
        items: { $ref: '#/components/schemas/PoolStanding' },
      },
      poolInfo: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          participantCount: { type: 'number' },
        },
      },
    },
  },

  // Error responses specific to pools
  PoolNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Pool not found' },
    },
  },

  InvalidPoolCodeError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Invalid pool code' },
    },
  },

  AlreadyJoinedError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'User already joined this pool' },
    },
  },

  NotPoolMemberError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'User is not a member of this pool' },
    },
  },

  NotPoolOwnerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Only pool owner can perform this action' },
    },
  },

  CannotLeaveOwnPoolError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Pool owner cannot leave their own pool' },
    },
  },

  // Reuse common error schemas
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

  InternalServerError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Internal server error.' },
    },
  },
};
