import { FastifyInstance } from 'fastify';
import { createPoolController } from '../controllers/pools/createPoolController';
import { getPoolController } from '../controllers/pools/getPoolController';
import { getPoolPredictionsController } from '../controllers/pools/getPoolPredictionsController';
import { getPoolStandingsController } from '../controllers/pools/getPoolStandingsController';
import { getPoolUsersController } from '../controllers/pools/getPoolUsersController';
import { JoinPoolController } from '../controllers/pools/joinPoolController';
import { leavePoolController } from '../controllers/pools/leavePoolController';
import { removeUserFromPoolController } from '../controllers/pools/removeUserFromPoolController';
import { updatePoolController } from '../controllers/pools/updatePoolController';
import { verifyJwt } from '../middlewares/verifyJWT';
import { poolSchemas } from '../schemas/pool.schemas';

export async function PoolRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post('/pools', {
    schema: {
      tags: ['Pools'],
      summary: 'Create a new pool',
      description: 'Creates a new prediction pool with a unique invitation code',
      body: poolSchemas.CreatePoolRequest,
      response: {
        201: {
          description: 'Pool created successfully',
          type: 'object',
          properties: {
            pool: poolSchemas.Pool
          }
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, createPoolController);

  app.get('/pools/:poolId', {
    schema: {
      tags: ['Pools'],
      summary: 'Get pool information',
      description: 'Retrieves detailed information about a specific pool',
      params: poolSchemas.PoolIdParam,
      response: {
        200: {
          description: 'Pool information retrieved successfully',
          type: 'object',
          properties: {
            pool: poolSchemas.Pool
          }
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        }
      }
    }
  }, getPoolController);

  app.post('/pools/join', {
    schema: {
      tags: ['Pools'],
      summary: 'Join a pool',
      description: 'Join an existing pool using its invitation code',
      body: poolSchemas.JoinPoolRequest,
      response: {
        200: {
          description: 'Successfully joined the pool',
          type: 'object',
          properties: {
            pool: poolSchemas.Pool
          }
        },
        400: {
          description: 'Invalid pool code',
          ...poolSchemas.InvalidPoolCodeError
        },
        409: {
          description: 'User already joined this pool',
          ...poolSchemas.AlreadyJoinedError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, JoinPoolController);

  app.post('/pools/:poolId/leave', {
    schema: {
      tags: ['Pools'],
      summary: 'Leave a pool',
      description: 'Leave a pool that the authenticated user has joined',
      params: poolSchemas.PoolIdParam,
      response: {
        200: {
          description: 'Successfully left the pool',
          ...poolSchemas.LeavePoolResponse
        },
        400: {
          description: 'Pool owner cannot leave their own pool',
          ...poolSchemas.CannotLeaveOwnPoolError
        },
        403: {
          description: 'User is not a member of this pool',
          ...poolSchemas.NotPoolMemberError
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, leavePoolController);

  app.delete('/pools/:poolId/users/:userId', {
    schema: {
      tags: ['Pools'],
      summary: 'Remove user from pool',
      description: 'Remove a specific user from the pool (only pool owner can perform this action)',
      params: poolSchemas.RemoveUserFromPoolParams,
      response: {
        200: {
          description: 'User successfully removed from pool',
          ...poolSchemas.RemoveUserFromPoolResponse
        },
        403: {
          description: 'Only pool owner can remove users',
          ...poolSchemas.NotPoolOwnerError
        },
        404: {
          description: 'Pool or user not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, removeUserFromPoolController);

  app.get('/pools/:poolId/users', {
    schema: {
      tags: ['Pools'],
      summary: 'Get pool users',
      description: 'Retrieves all users participating in the specified pool',
      params: poolSchemas.PoolIdParam,
      response: {
        200: {
          description: 'Pool users retrieved successfully',
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: poolSchemas.PoolUser
            },
            count: { type: 'number' }
          }
        },
        403: {
          description: 'User is not a member of this pool',
          ...poolSchemas.NotPoolMemberError
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        }
      }
    }
  }, getPoolUsersController);

  app.put('/pools/:poolId', {
    schema: {
      tags: ['Pools'],
      summary: 'Update pool information',
      description: 'Updates pool information (only pool owner can perform this action)',
      params: poolSchemas.PoolIdParam,
      body: poolSchemas.UpdatePoolRequest,
      response: {
        200: {
          description: 'Pool updated successfully',
          type: 'object',
          properties: {
            pool: poolSchemas.Pool
          }
        },
        403: {
          description: 'Only pool owner can update the pool',
          ...poolSchemas.NotPoolOwnerError
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, updatePoolController);

  app.get('/pools/:poolId/predictions', {
    schema: {
      tags: ['Pools'],
      summary: 'Get pool predictions',
      description: 'Retrieves all predictions made by users in the specified pool',
      params: poolSchemas.PoolIdParam,
      response: {
        200: {
          description: 'Pool predictions retrieved successfully',
          type: 'object',
          properties: {
            predictions: {
              type: 'array',
              items: poolSchemas.PoolPrediction
            }
          }
        },
        403: {
          description: 'User is not a member of this pool',
          ...poolSchemas.NotPoolMemberError
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, getPoolPredictionsController);

  app.get('/pools/:poolId/standings', {
    schema: {
      tags: ['Pools'],
      summary: 'Get pool standings',
      description: 'Retrieves the current standings/leaderboard for the specified pool',
      params: poolSchemas.PoolIdParam,
      response: {
        200: {
          description: 'Pool standings retrieved successfully',
          type: 'object',
          properties: {
            standings: {
              type: 'array',
              items: poolSchemas.PoolStanding
            },
            poolInfo: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                title: { type: 'string' },
                participantCount: { type: 'number' }
              }
            }
          }
        },
        403: {
          description: 'User is not a member of this pool',
          ...poolSchemas.NotPoolMemberError
        },
        404: {
          description: 'Pool not found',
          ...poolSchemas.PoolNotFoundError
        },
        422: {
          description: 'Validation error',
          ...poolSchemas.ValidationError
        },
        500: {
          description: 'Internal server error',
          ...poolSchemas.InternalServerError
        }
      }
    }
  }, getPoolStandingsController);
}
