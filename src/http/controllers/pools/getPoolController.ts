import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolUseCase } from '@/useCases/pools/factory/makeGetPoolUseCase';

const getPoolParamsSchema = z.object({
  poolId: z.coerce.number(),
});

type GetPoolParams = z.infer<typeof getPoolParamsSchema>;

export async function getPoolController(
  request: FastifyRequest<{ Params: GetPoolParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { poolId } = getPoolParamsSchema.parse(request.params);

    const userId = request.user.sub;

    const getPoolUseCase = makeGetPoolUseCase();

    const pool = await getPoolUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send({
      pool,
    });
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

    throw error; // Re-throw unexpected errors to be handled by the global error handler
  }
}
