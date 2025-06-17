import { NotParticipantError } from '@/global/errors/NotParticipantError';
import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserPredictionsUseCase } from '@/useCases/users/factory/makeGetUserPredictionsUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getUserPredictionsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const querySchema = z.object({
      poolId: z.coerce.number().positive().optional(),
    });

    const { poolId } = querySchema.parse(request.query);

    // Get userId from authenticated user
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

    console.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }
}
