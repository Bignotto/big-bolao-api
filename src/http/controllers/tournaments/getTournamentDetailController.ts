import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetTournamentDetailUseCase } from '@/useCases/tournaments/factories/makeGetTournamentDetailUseCase';

const getTournamentDetailParamsSchema = z.object({
  tournamentId: z.coerce.number(),
});

type GetTournamentDetailParams = z.infer<typeof getTournamentDetailParamsSchema>;

export async function getTournamentDetailController(
  request: FastifyRequest<{
    Params: GetTournamentDetailParams;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { tournamentId } = getTournamentDetailParamsSchema.parse(request.params);

    const useCase = makeGetTournamentDetailUseCase();
    const { tournament } = await useCase.execute({ tournamentId });

    return reply.status(200).send({ tournament });
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}

