import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolMatchPredictionsUseCase } from '@/useCases/pools/factory/makeGetPoolMatchPredictionsUseCase';

const getPoolMatchPredictionsParamsSchema = z.object({
  poolId: z.coerce.number(),
  matchId: z.coerce.number(),
});

type GetPoolMatchPredictionsParams = z.infer<typeof getPoolMatchPredictionsParamsSchema>;

export async function getPoolMatchPredictionsController(
  request: FastifyRequest<{ Params: GetPoolMatchPredictionsParams }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const { poolId, matchId } = getPoolMatchPredictionsParamsSchema.parse(request.params);
    const userId = request.user.sub;

    const getPoolMatchPredictionsUseCase = makeGetPoolMatchPredictionsUseCase();

    const { predictions } = await getPoolMatchPredictionsUseCase.execute({
      poolId,
      matchId,
      userId,
    });

    return reply.status(200).send({ predictions });
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
