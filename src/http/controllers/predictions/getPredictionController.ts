import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/predictions/error/NotParticipantError';
import { makeGetPredictionUseCase } from '@/useCases/predictions/factories/makeGetPredictionUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getPredictionController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const getPredictionParamsSchema = z.object({
      predictionId: z.coerce.number(),
    });

    const { predictionId } = getPredictionParamsSchema.parse(request.params);

    const userId = request.user.sub;

    const getPredictionUseCase = makeGetPredictionUseCase();

    const prediction = await getPredictionUseCase.execute({
      predictionId,
      userId,
    });

    return reply.status(200).send({
      prediction,
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
