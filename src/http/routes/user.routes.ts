import { FastifyInstance } from 'fastify';
import {
  createUserBody,
  errorResponseSchema,
  updateUserBody,
  userIdParam,
  userSchema,
} from '../schemas';
import { CreateUserController } from '../controllers/user/createUserController';
import { GetLoggedUserInfoController } from '../controllers/user/getLoggedUserInfoController';
import { GetUserInfoController } from '../controllers/user/getUserInfoController';
import { getUserPoolsController } from '../controllers/user/getUserPoolsController';
import { getUserPoolsStandingsController } from '../controllers/user/getUserPoolsStandingsController';
import { getUserPredictionsController } from '../controllers/user/getUserPredictionsController';
import { UpdateUserController } from '../controllers/user/updateUserController';
import { verifyJwt } from '../middlewares/verifyJWT';

export async function UserRoutes(app: FastifyInstance) {
  app.addHook('onRequest', verifyJwt);

  app.post(
    '/users',
    {
      schema: {
        body: createUserBody,
        response: {
          201: { type: 'object', properties: { user: userSchema } },
          409: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    CreateUserController,
  );

  app.put(
    '/users/:userId',
    {
      schema: {
        params: userIdParam,
        body: updateUserBody,
        response: {
          200: { type: 'object', properties: { user: userSchema } },
          404: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    UpdateUserController,
  );

  app.get(
    '/users/:userId',
    {
      schema: {
        params: userIdParam,
        response: {
          200: { type: 'object', properties: { user: userSchema } },
          404: errorResponseSchema,
        },
      },
    },
    GetUserInfoController,
  );

  app.get(
    '/users/me',
    {
      schema: {
        response: {
          200: { type: 'object', properties: { user: userSchema } },
          404: errorResponseSchema,
        },
      },
    },
    GetLoggedUserInfoController,
  );
  app.get(
    '/users/:userId/pools',
    {
      schema: {
        params: userIdParam,
        response: {
          200: {
            type: 'object',
            properties: { pools: { type: 'array', items: poolSchema } },
          },
          404: errorResponseSchema,
        },
      },
    },
    getUserPoolsController,
  );
  app.get(
    '/users/me/predictions',
    {
      schema: {
        querystring: poolIdQuery,
        response: {
          200: {
            type: 'object',
            properties: { predictions: { type: 'array', items: predictionSchema } },
          },
          404: errorResponseSchema,
          403: errorResponseSchema,
          422: errorResponseSchema,
        },
      },
    },
    getUserPredictionsController,
  );
  app.get(
    '/users/me/pools/standings',
    {
      schema: {
        response: {
          200: { type: 'object', properties: { standing: { type: 'array', items: poolStandingSchema } } },
          404: errorResponseSchema,
        },
      },
    },
    getUserPoolsStandingsController,
  );
}
