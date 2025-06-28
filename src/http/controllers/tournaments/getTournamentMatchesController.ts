import { PrismaMatchesRepository } from '@/repositories/matches/PrismaMatchesRepository';
import { GetTournamentMatchesUseCase } from '@/useCases/tournaments/getTournamentMatchesUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getTournamentMatchesController(request: FastifyRequest, reply: FastifyReply) {
  const getTournamentMatchesParamsSchema = z.object({
    tournamentId: z.coerce.number(),
  });

  const { tournamentId } = getTournamentMatchesParamsSchema.parse(request.params);

  const matchesRepository = new PrismaMatchesRepository();
  const getTournamentMatchesUseCase = new GetTournamentMatchesUseCase(matchesRepository);

  const { matches } = await getTournamentMatchesUseCase.execute({ tournamentId });

  return reply.status(200).send({ matches });
}
