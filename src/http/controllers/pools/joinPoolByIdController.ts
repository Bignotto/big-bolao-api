import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeJoinPoolByIdUseCase } from '@/useCases/pools/factory/makeJoinPoolByIdUseCase';

const joinPoolByIdParamsSchema = z.object({
  poolId: z.coerce.number(),
});

export async function joinPoolByIdController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.user.sub;
    const { poolId } = joinPoolByIdParamsSchema.parse(request.params);

    const joinPoolByIdUseCase = makeJoinPoolByIdUseCase();

    const pool = await joinPoolByIdUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send({
      pool: {
        id: pool.id,
        name: pool.name,
        isPrivate: pool.isPrivate,
      },
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({
        message: 'Validation error',
        issues: error.format(),
      });
    }

    throw error; // Re-throw to be handled by global error handler
  }
}
