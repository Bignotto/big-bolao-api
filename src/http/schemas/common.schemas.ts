import type { OpenAPIV3 } from 'openapi-types';

export const commonSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  UnauthorizedError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Unauthorized' },
    },
  },

  MatchNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Match not found' },
    },
  },

  PoolNotFoundError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Pool not found' },
    },
  },

  NotPoolMemberError: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'User is not a member of this pool' },
    },
  },
};
