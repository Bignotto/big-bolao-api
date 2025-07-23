import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolPredictionsUseCase } from '@/useCases/pools/factory/makeGetPoolPredictionsUseCase';

const getPoolPredictionsParamsSchema = z.object({
  poolId: z.coerce.number(),
});

type GetPoolPredictionsParams = z.infer<typeof getPoolPredictionsParamsSchema>;

export async function getPoolPredictionsController(
  request: FastifyRequest<{ Params: GetPoolPredictionsParams }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const { poolId } = getPoolPredictionsParamsSchema.parse(request.params);

    const userId = request.user.sub;

    const getPoolPredictionsUseCase = makeGetPoolPredictionsUseCase();

    const { predictions } = await getPoolPredictionsUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send({
      predictions,
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
