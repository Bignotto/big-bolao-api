import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetMatchPredictionsUseCase } from '@/useCases/matches/factories/makeGetMatchPredictionsUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getMatchPredictions(request: FastifyRequest, reply: FastifyReply) {
  const getMatchPredictionsParamsSchema = z.object({
    matchId: z.coerce.number(),
  });

  try {
    const { matchId } = getMatchPredictionsParamsSchema.parse(request.params);
    const getMatchPredictionsUseCase = makeGetMatchPredictionsUseCase();

    const predictions = await getMatchPredictionsUseCase.execute({
      matchId,
    });

    return reply.status(200).send({ predictions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
    //return reply.status(500).send({ message: 'Internal server error' });
  }
}
