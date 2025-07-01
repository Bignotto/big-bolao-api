import { FastifyInstance } from 'fastify';
import {
  createPoolBody,
  errorResponseSchema,
  poolIdParam,
  poolSchema,
  poolStandingSchema,
  updatePoolBody,
  userIdParam,
  userSchema,
  predictionSchema,
} from '../schemas';
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

export async function PoolRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post(
    '/pools',
    {
      schema: {
        body: createPoolBody,
        response: {
          201: { type: 'object', properties: { pool: poolSchema } },
          409: errorResponseSchema,
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    createPoolController,
  );
  app.get(
    '/pools/:poolId',
    {
      schema: {
        params: poolIdParam,
        response: {
          200: { type: 'object', properties: { pool: poolSchema } },
          404: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    getPoolController,
  );
  app.post(
    '/pools/join',
    {
      schema: {
        body: poolIdParam,
        response: { 200: { type: 'object', properties: { pool: poolSchema } }, 404: errorResponseSchema, 403: errorResponseSchema },
      },
    },
    JoinPoolController,
  );
  app.post(
    '/pools/:poolId/leave',
    {
      schema: {
        params: poolIdParam,
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } }, 404: errorResponseSchema },
      },
    },
    leavePoolController,
  );
  app.delete(
    '/pools/:poolId/users/:userId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            poolId: { type: 'string' },
            userId: { type: 'string' },
          },
          required: ['poolId', 'userId'],
        },
        response: { 200: { type: 'object', properties: { message: { type: 'string' } } }, 404: errorResponseSchema },
      },
    },
    removeUserFromPoolController,
  );
  app.get(
    '/pools/:poolId/users',
    {
      schema: {
        params: poolIdParam,
        response: {
          200: { type: 'object', properties: { users: { type: 'array', items: userSchema } } },
          404: errorResponseSchema,
        },
      },
    },
    getPoolUsersController,
  );
  app.put(
    '/pools/:poolId',
    {
      schema: {
        params: poolIdParam,
        body: updatePoolBody,
        response: {
          200: { type: 'object', properties: { pool: poolSchema } },
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    updatePoolController,
  );
  app.get(
    '/pools/:poolId/predictions',
    {
      schema: {
        params: poolIdParam,
        response: {
          200: { type: 'object', properties: { predictions: { type: 'array', items: predictionSchema } } },
          404: errorResponseSchema,
        },
      },
    },
    getPoolPredictionsController,
  );
  app.get(
    '/pools/:poolId/standings',
    {
      schema: {
        params: poolIdParam,
        response: {
          200: { type: 'object', properties: { standings: { type: 'array', items: poolStandingSchema } } },
          404: errorResponseSchema,
        },
      },
    },
    getPoolStandingsController,
  );
}
