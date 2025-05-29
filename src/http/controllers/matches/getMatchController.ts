import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetMatchUseCase } from '@/useCases/matches/factories/makeGetMatchUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getMatchController(
  request: FastifyRequest<{
    Params: { matchId: string };
  }>,
  reply: FastifyReply
) {
  const getMatchParamsSchema = z.object({
    matchId: z.coerce.number(),
  });

  const { matchId } = getMatchParamsSchema.parse(request.params);

  try {
    const getMatchUseCase = makeGetMatchUseCase();

    const match = await getMatchUseCase.execute({
      matchId,
    });

    return reply.status(200).send({
      match,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
