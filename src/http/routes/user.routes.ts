import { FastifyInstance } from 'fastify';

import { createUserController } from '../controllers/user/createUserController';
import { GetLoggedUserInfoController } from '../controllers/user/getLoggedUserInfoController';
import { GetUserInfoController } from '../controllers/user/getUserInfoController';
import { getUserPoolsController } from '../controllers/user/getUserPoolsController';
import { getUserPoolsStandingsController } from '../controllers/user/getUserPoolsStandingsController';
import { getUserPredictionsController } from '../controllers/user/getUserPredictionsController';
import { updateUserController } from '../controllers/user/updateUserController';
import { verifyJwt } from '../middlewares/verifyJWT';
import { userSchemas } from '../schemas/user.schemas';

export function UserRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifyJwt);

  app.post(
    '/users',
    {
      schema: {
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Creates a new user account with email, password, full name and profile image',
        body: userSchemas.CreateUserRequest,
        response: {
          201: {
            description: 'User created successfully',
            type: 'object',
            properties: {
              user: userSchemas.User,
            },
          },
          409: {
            description: 'Email already in use',
            ...userSchemas.EmailInUseError,
          },
          422: {
            description: 'Validation error',
            ...userSchemas.ValidationError,
          },
        },
      },
    },
    createUserController
  );

  app.put(
    '/users/:userId',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update user information',
        description: 'Updates user profile information (email, full name, profile image)',
        params: userSchemas.UserIdParam,
        body: userSchemas.UpdateUserRequest,
        response: {
          200: {
            description: 'User updated successfully',
            type: 'object',
            properties: {
              user: userSchemas.User,
            },
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...userSchemas.ValidationError,
          },
        },
      },
    },
    updateUserController
  );

  app.get(
    '/users/:userId',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user information by ID',
        description: 'Retrieves user profile information by user ID',
        params: userSchemas.UserIdParam,
        response: {
          200: {
            description: 'User information retrieved successfully',
            type: 'object',
            properties: {
              user: userSchemas.User,
            },
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
        },
      },
    },
    GetUserInfoController
  );

  app.get(
    '/users/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get logged user information',
        description: "Retrieves the authenticated user's profile information",
        response: {
          200: {
            description: 'Logged user information retrieved successfully',
            type: 'object',
            properties: {
              user: userSchemas.User,
            },
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
        },
      },
    },
    GetLoggedUserInfoController
  );

  app.get(
    '/users/:userId/pools',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user pools',
        description: 'Retrieves all pools that the specified user participates in',
        params: userSchemas.UserIdParam,
        response: {
          200: {
            description: 'User pools retrieved successfully',
            type: 'object',
            properties: {
              pools: {
                type: 'array',
                items: userSchemas.Pool,
              },
            },
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
        },
      },
    },
    getUserPoolsController
  );

  app.get(
    '/users/me/predictions',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get logged user predictions',
        description:
          'Retrieves all predictions made by the authenticated user, optionally filtered by pool',
        querystring: userSchemas.GetUserPredictionsQuery,
        response: {
          200: {
            description: 'User predictions retrieved successfully',
            type: 'object',
            properties: {
              predictions: {
                type: 'array',
                items: userSchemas.Prediction,
              },
            },
          },
          403: {
            description: 'User is not a participant of the specified pool',
            ...userSchemas.NotParticipantError,
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...userSchemas.ValidationError,
          },
          500: {
            description: 'Internal server error',
            ...userSchemas.InternalServerError,
          },
        },
      },
    },
    getUserPredictionsController
  );

  app.get(
    '/users/me/pools/standings',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get logged user pools standings',
        description:
          "Retrieves the authenticated user's standings across all pools they participate in",
        response: {
          200: {
            description: 'User pool standings retrieved successfully',
            type: 'object',
            properties: {
              standing: {
                type: 'array',
                items: userSchemas.Standing,
              },
            },
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
          500: {
            description: 'Internal server error',
            ...userSchemas.InternalServerError,
          },
        },
      },
    },
    getUserPoolsStandingsController
  );
}
