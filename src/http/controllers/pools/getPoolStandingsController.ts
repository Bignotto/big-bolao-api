import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolStandingsUseCase } from '@/useCases/pools/factory/makeGetPoolStandingsUseCase';

export async function getPoolStandingsController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const getPoolStandingsParamsSchema = z.object({
      poolId: z.coerce.number(),
    });

    const { poolId } = getPoolStandingsParamsSchema.parse(request.params);

    const userId = request.user.sub;

    const getPoolStandingsUseCase = makeGetPoolStandingsUseCase();

    const { standings } = await getPoolStandingsUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send({
      standings,
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
    throw error;
  }
}
