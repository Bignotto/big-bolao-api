import { FastifyInstance } from 'fastify';

import { createUserController } from '@/http/controllers/user/createUserController';
import { getLoggedUserInfoController } from '@/http/controllers/user/getLoggedUserInfoController';
import { getUserInfoController } from '@/http/controllers/user/getUserInfoController';
import { getUserPoolsController } from '@/http/controllers/user/getUserPoolsController';
import { getUserPoolsStandingsController } from '@/http/controllers/user/getUserPoolsStandingsController';
import { getUserPredictionsController } from '@/http/controllers/user/getUserPredictionsController';
import { updateUserController } from '@/http/controllers/user/updateUserController';
import { verifyJwt } from '@/http/middlewares/verifyJwt';
import { userSchemas } from '@/http/schemas/user.schemas';

export function userRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', verifyJwt);

  // Public route for user registration
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
            ...userSchemas.UserValidationError,
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
          401: {
            description: 'Unauthorized access',
            ...userSchemas.UnauthorizedError,
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
          422: {
            description: 'Validation error',
            ...userSchemas.UserValidationError,
          },
        },
      },
    },
    updateUserController
  );

  // Public route to fetch user information by ID
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
    getUserInfoController
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
          401: {
            description: 'Unauthorized access',
            ...userSchemas.UnauthorizedError,
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
        },
      },
    },
    getLoggedUserInfoController
  );

  // Public route to list pools for a user
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
                items: userSchemas.UserPool,
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
          401: {
            description: 'Unauthorized access',
            ...userSchemas.UnauthorizedError,
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
            ...userSchemas.UserValidationError,
          },
          500: {
            description: 'Internal server error',
            ...userSchemas.UserInternalServerError,
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
          401: {
            description: 'Unauthorized access',
            ...userSchemas.UnauthorizedError,
          },
          404: {
            description: 'User not found',
            ...userSchemas.ResourceNotFoundError,
          },
          500: {
            description: 'Internal server error',
            ...userSchemas.UserInternalServerError,
          },
        },
      },
    },
    getUserPoolsStandingsController
  );
}
