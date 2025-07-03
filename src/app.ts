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

  // Register Swagger
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
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Register custom decorators
  //server.decorateRequest('user', null);

  // Register routes
  await server.register(routes);

  // Health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  server.setErrorHandler((error, _, reply) => {
    console.log(JSON.stringify(error, null, 2));

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

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
