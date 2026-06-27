import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeGetTeamRecentFormUseCase } from '@/useCases/teams/factories/makeGetTeamRecentFormUseCase';

export async function getTeamRecentFormController(
  request: FastifyRequest<{
    Params: { teamId: string };
    Querystring: { limit?: string };
  }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const paramsSchema = z.object({
    teamId: z.coerce.number().int().positive(),
  });

  const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(10).default(3),
  });

  const { teamId } = paramsSchema.parse(request.params);
  const { limit } = querySchema.parse(request.query);

  const useCase = makeGetTeamRecentFormUseCase();
  const result = await useCase.execute({ teamId, limit });

  return reply.status(200).send(result);
}
