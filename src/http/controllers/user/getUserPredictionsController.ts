import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { NotParticipantError } from '@/global/errors/NotParticipantError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserPredictionsUseCase } from '@/useCases/users/factory/makeGetUserPredictionsUseCase';

const getUserPredictionsQuerySchema = z.object({
  poolId: z.coerce.number().positive().optional(),
});

type GetUserPredictionsQuery = z.infer<typeof getUserPredictionsQuerySchema>;

export async function getUserPredictionsController(
  request: FastifyRequest<{ Querystring: GetUserPredictionsQuery }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { poolId } = getUserPredictionsQuerySchema.parse(request.query);

    const userId = request.user.sub;

    const getUserPredictionsUseCase = makeGetUserPredictionsUseCase();
    const { predictions } = await getUserPredictionsUseCase.execute({
      userId,
      poolId,
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
