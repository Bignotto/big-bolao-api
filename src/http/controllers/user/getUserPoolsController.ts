import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserPoolsUseCase } from '@/useCases/pools/factory/makeGetUserPoolsUseCase';

export async function getUserPoolsController(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const paramsSchema = z.object({
      userId: z.string(),
    });

    const { userId } = paramsSchema.parse(request.params);

    const getUserPoolsUseCase = makeGetUserPoolsUseCase();
    const { pools } = await getUserPoolsUseCase.execute({
      userId,
    });

    return reply.status(200).send({
      pools,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
