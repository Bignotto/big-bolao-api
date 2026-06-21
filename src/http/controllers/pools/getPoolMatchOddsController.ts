import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolMatchOddsUseCase } from '@/useCases/pools/factory/makeGetPoolMatchOddsUseCase';

export async function getPoolMatchOddsController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const paramsSchema = z.object({ poolId: z.coerce.number() });
    const { poolId } = paramsSchema.parse(request.params);
    const userId = request.user.sub;

    const useCase = makeGetPoolMatchOddsUseCase();
    const { odds } = await useCase.execute({ poolId, userId });

    return reply.status(200).send({ odds });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof NotParticipantError) {
      return reply.status(403).send({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error.', issues: error.format() });
    }
    throw error;
  }
}
