import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastify, { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from './env/config';
import { prisma } from './lib/prisma';

// Create Fastify server
export const createServer = async (): Promise<FastifyInstance> => {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  // Register plugins
  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-token',
  });

  await server.register(cors, {
    origin: true, // Allows all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Register custom decorators
  //server.decorateRequest('user', null);

  // Register routes
  //   await server.register(routes);

  // Health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  server.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
      if (env.NODE_ENV !== 'test') console.log(JSON.stringify(error, null, 2));

      return reply.status(500).send({ message: 'Validation error', issues: error.format() });
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
  console.log(`Received signal to terminate: ${signal}`);

  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));
