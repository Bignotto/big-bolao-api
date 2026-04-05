import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetMyMatchPredictionsUseCase } from '@/useCases/predictions/factories/makeGetMyMatchPredictionsUseCase';

const paramsSchema = z.object({
  matchId: z.coerce.number(),
});

type Params = z.infer<typeof paramsSchema>;

export async function getMyMatchPredictionsController(
  request: FastifyRequest<{ Params: Params }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  try {
    const { matchId } = paramsSchema.parse(request.params);
    const userId = request.user.sub;

    const useCase = makeGetMyMatchPredictionsUseCase();
    const { predictions } = await useCase.execute({ matchId, userId });

    return reply.status(200).send({ predictions });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    throw error;
  }
}
