import { FastifyInstance } from 'fastify';

import { createPoolController } from '@/http/controllers/pools/createPoolController';
import { getPoolController } from '@/http/controllers/pools/getPoolController';
import { getPoolPredictionsController } from '@/http/controllers/pools/getPoolPredictionsController';
import { getPoolStandingsController } from '@/http/controllers/pools/getPoolStandingsController';
import { getPoolUsersController } from '@/http/controllers/pools/getPoolUsersController';
import { joinPoolByIdController } from '@/http/controllers/pools/joinPoolByIdController';
import { joinPoolByInviteController } from '@/http/controllers/pools/joinPoolByInviteController';
import { leavePoolController } from '@/http/controllers/pools/leavePoolController';
import { listPublicPoolsController } from '@/http/controllers/pools/listPublicPoolsController';
import { removeUserFromPoolController } from '@/http/controllers/pools/removeUserFromPoolController';
import { updatePoolController } from '@/http/controllers/pools/updatePoolController';
import { verifyJwt } from '@/http/middlewares/verifyJwt';
import { poolSchemas } from '@/http/schemas/pool.schemas';

export function poolRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifyJwt);

  app.get(
    '/pools',
    {
      schema: {
        tags: ['Pools'],
        summary: 'List public pools',
        description: 'Lists public pools with optional pagination and name filtering',
        querystring: poolSchemas.ListPublicPoolsQuery,
        response: {
          200: {
            description: 'Public pools listed successfully',
            ...poolSchemas.ListPublicPoolsResponse,
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
        },
      },
    },
    listPublicPoolsController
  );

  app.post(
    '/pools',
    {
      schema: {
        tags: ['Pools'],
        summary: 'Create a new pool',
        description: 'Creates a new prediction pool with a unique invitation code',
        response: {
          201: {
            description: 'Pool created successfully',
            type: 'object',
            properties: {
              pool: poolSchemas.Pool,
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    createPoolController
  );

  app.get(
    '/pools/:poolId',
    {
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
              pool: poolSchemas.Pool,
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
        },
      },
    },
    getPoolController
  );

  // Join pool by ID (public pools)
  app.post(
    '/pools/:poolId/users',
    {
      schema: {
        tags: ['Pools'],
        summary: 'Join a public pool by ID',
        description: 'Join a public pool using its ID. Private pools cannot be joined this way.',
        params: poolSchemas.JoinPoolByIdParams,
        response: {
          200: {
            description: 'Successfully joined the pool',
            type: 'object',
            properties: {
              pool: poolSchemas.Pool,
            },
          },
          403: {
            description: 'Forbidden to join this pool',
            ...poolSchemas.UnauthorizedError,
          },
          404: {
            description: 'Pool or user not found',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    joinPoolByIdController
  );

  // Join pool by invite code (works for both public and private pools)
  app.post(
    '/pool-invites/:inviteCode',
    {
      schema: {
        tags: ['Pools'],
        summary: 'Join a pool by invite code',
        description: 'Join any pool (public or private) using its invitation code',
        params: poolSchemas.JoinPoolByInviteParams,
        response: {
          200: {
            description: 'Successfully joined the pool',
            type: 'object',
            properties: {
              pool: poolSchemas.Pool,
            },
          },
          403: {
            description: 'Forbidden to join this pool',
            ...poolSchemas.UnauthorizedError,
          },
          404: {
            description: 'Pool not found with this invite code',
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    joinPoolByInviteController
  );

  app.delete(
    '/pools/:poolId/users/me',
    {
      schema: {
        tags: ['Pools'],
        summary: 'Leave a pool',
        description: 'Remove the authenticated user from the specified pool',
        params: poolSchemas.PoolIdParam,
        response: {
          200: {
            description: 'Successfully left the pool',
            ...poolSchemas.LeavePoolResponse,
          },
          400: {
            description: 'Pool owner cannot leave their own pool',
            ...poolSchemas.CannotLeaveOwnPoolError,
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'User is not a member of this pool',
            ...poolSchemas.NotPoolMemberError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    leavePoolController
  );

  app.delete(
    '/pools/:poolId/users/:userId',
    {
      schema: {
        tags: ['Pools'],
        summary: 'Remove user from pool',
        description:
          'Remove a specific user from the pool (only pool owner can perform this action)',
        params: poolSchemas.RemoveUserFromPoolParams,
        response: {
          200: {
            description: 'User successfully removed from pool',
            ...poolSchemas.RemoveUserFromPoolResponse,
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'Only pool owner can remove users',
            ...poolSchemas.NotPoolOwnerError,
          },
          404: {
            description: 'Pool or user not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    removeUserFromPoolController
  );

  app.get(
    '/pools/:poolId/users',
    {
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
                items: poolSchemas.PoolUser,
              },
              count: { type: 'number' },
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'User is not a member of this pool',
            ...poolSchemas.NotPoolMemberError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
        },
      },
    },
    getPoolUsersController
  );

  app.put(
    '/pools/:poolId',
    {
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
              pool: poolSchemas.Pool,
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'Only pool owner can update the pool',
            ...poolSchemas.NotPoolOwnerError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    updatePoolController
  );

  app.get(
    '/pools/:poolId/predictions',
    {
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
                items: poolSchemas.PoolPrediction,
              },
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'User is not a member of this pool',
            ...poolSchemas.NotPoolMemberError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    getPoolPredictionsController
  );

  app.get(
    '/pools/:poolId/standings',
    {
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
                items: poolSchemas.PoolStanding,
              },
              poolInfo: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  participantCount: { type: 'number' },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized access',
            ...poolSchemas.UnauthorizedError,
          },
          403: {
            description: 'User is not a member of this pool',
            ...poolSchemas.NotPoolMemberError,
          },
          404: {
            description: 'Pool not found',
            ...poolSchemas.PoolNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...poolSchemas.PoolValidationError,
          },
          500: {
            description: 'Internal server error',
            ...poolSchemas.PoolInternalServerError,
          },
        },
      },
    },
    getPoolStandingsController
  );
}
