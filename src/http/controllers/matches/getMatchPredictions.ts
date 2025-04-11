import { makeGetMatchPredictionsUseCase } from '@/useCases/matches/factories/makeGetMatchPredictionsUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getMatchPredictions(request: FastifyRequest, reply: FastifyReply) {
  const getMatchPredictionsParamsSchema = z.object({
    matchId: z.coerce.number(),
  });

  const { matchId } = getMatchPredictionsParamsSchema.parse(request.params);

  try {
    const getMatchPredictionsUseCase = makeGetMatchPredictionsUseCase();

    const predictions = await getMatchPredictionsUseCase.execute({
      matchId,
    });

    return reply.status(200).send({ predictions });
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(400).send({ message: error.message });
    }
    return reply.status(500).send({ message: 'Internal server error' });
  }
}
