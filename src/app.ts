import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify, { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { env } from './env/config';
import { routes } from './http/routes';
import { prisma } from './lib/prisma';

// Create Fastify server
export const createServer = async (): Promise<FastifyInstance> => {
  const server = fastify({
    logger:
      env.NODE_ENV !== 'test'
        ? {
            level: env.LOG_LEVEL || 'error',
            transport: {
              target: 'pino-pretty',
            },
          }
        : false,
  });

  // Register plugins
  await server.register(fastifyJwt, {
    secret: env.THE_APP_SECRET || 'super-secret-jwt-token',
  });

  await server.register(cors, {
    origin: true, // Allows all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Import schemas first
  const { poolSchemas } = await import('./http/schemas/pool.schemas');
  const { userSchemas } = await import('./http/schemas/user.schemas');
  const { matchSchemas } = await import('./http/schemas/match.schemas');
  const { predictionSchemas } = await import('./http/schemas/prediction.schemas');
  const { tournamentSchemas } = await import('./http/schemas/tournament.schemas');

  // Combine all schemas and remove duplicates
  const allSchemas: Record<string, any> = {};

  // Add schemas, with later ones overriding earlier ones if there are duplicates
  Object.assign(allSchemas, poolSchemas);
  Object.assign(allSchemas, userSchemas);
  Object.assign(allSchemas, matchSchemas);
  Object.assign(allSchemas, predictionSchemas);
  Object.assign(allSchemas, tournamentSchemas);

  if (env.NODE_ENV !== 'test') {
    // Register Swagger with all schemas
    await server.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Big Bolão API',
          description: 'API for managing pools, predictions, and tournaments',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.PORT || 3333}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
          schemas: allSchemas,
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
      uiHooks: {
        onRequest: function (_request, _reply, next) {
          next();
        },
        preHandler: function (_request, _reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, _request, _reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
  }
  // Register schemas for Fastify validation (these use simple IDs)
  Object.entries(allSchemas).forEach(([key, schema]) => {
    server.addSchema({ $id: key, ...(schema as object) });
  });
  // Register routes
  await server.register(routes);

  // Health check route
  server.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  server.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
      if (env.NODE_ENV !== 'test') console.log(JSON.stringify(error, null, 2));

      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    if (env.NODE_ENV !== 'production') {
      console.error(error);
    } else {
      // TODO: log unknown error
    }

    return reply.status(500).send({ message: 'Unknown error...' });
  });

  return server;
};
// Graceful shutdown handler
export const closeGracefully = async (signal: string) => {
  if (env.NODE_ENV !== 'test') console.log(`Received signal to terminate: ${signal}`);

  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => {
  closeGracefully('SIGINT').catch((err) => {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  });
});
process.on('SIGTERM', () => {
  closeGracefully('SIGTERM').catch((err) => {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  });
});
