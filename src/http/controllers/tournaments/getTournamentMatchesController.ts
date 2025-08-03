import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetTournamentMatchesUseCase } from '@/useCases/tournaments/factories/makeGetTournamentMatches';

const getTournamentMatchesParamsSchema = z.object({
  tournamentId: z.coerce.number(),
});

type GetTournamentMatchesParams = z.infer<typeof getTournamentMatchesParamsSchema>;

export async function getTournamentMatchesController(
  request: FastifyRequest<{
    Params: GetTournamentMatchesParams;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { tournamentId } = getTournamentMatchesParamsSchema.parse(request.params);

    const getTournamentMatchesUseCase = makeGetTournamentMatchesUseCase();
    const { matches } = await getTournamentMatchesUseCase.execute({ tournamentId });

    return reply.status(200).send({ matches });
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}
