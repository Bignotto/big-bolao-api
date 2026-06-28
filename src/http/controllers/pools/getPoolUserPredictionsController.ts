import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolUserPredictionsUseCase } from '@/useCases/pools/factory/makeGetPoolUserPredictionsUseCase';

const paramsSchema = z.object({
  poolId: z.coerce.number(),
  userId: z.string(),
});

type Params = z.infer<typeof paramsSchema>;

export async function getPoolUserPredictionsController(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const { poolId, userId: targetUserId } = paramsSchema.parse(request.params);
    const requesterId = request.user.sub;

    const useCase = makeGetPoolUserPredictionsUseCase();

    const { predictions } = await useCase.execute({ poolId, requesterId, targetUserId });

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
