import { MatchStage, MatchStatus } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchUpdateError } from '@/useCases/matches/errors/MatchUpdateError';
import { makeUpdateMatchUseCase } from '@/useCases/matches/factories/makeUpdateMatchUseCase';

const updateMatchParamsSchema = z.object({
  matchId: z.coerce.number(),
});

const updateMatchBodySchema = z.object({
  homeTeam: z.number().optional(),
  awayTeam: z.number().optional(),
  homeTeamScore: z.number().optional(),
  awayTeamScore: z.number().optional(),
  matchDate: z.string().datetime().optional(),
  matchStatus: z.nativeEnum(MatchStatus).optional(),
  matchStage: z.nativeEnum(MatchStage).optional(),
  hasExtraTime: z.boolean().optional(),
  hasPenalties: z.boolean().optional(),
  penaltyHomeScore: z.number().optional(),
  penaltyAwayScore: z.number().optional(),
  stadium: z.string().optional(),
});

type UpdateMatchParams = z.infer<typeof updateMatchParamsSchema>;
type UpdateMatchBody = z.infer<typeof updateMatchBodySchema>;

export async function updateMatchController(
  request: FastifyRequest<{ Params: UpdateMatchParams; Body: UpdateMatchBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { matchId } = updateMatchParamsSchema.parse(request.params);
    const {
      homeTeam,
      awayTeam,
      homeTeamScore,
      awayTeamScore,
      matchDate,
      matchStatus,
      matchStage,
      hasExtraTime,
      hasPenalties,
      penaltyHomeScore,
      penaltyAwayScore,
      stadium,
    } = updateMatchBodySchema.parse(request.body);

    const updateMatchUseCase = makeUpdateMatchUseCase();

    const match = await updateMatchUseCase.execute({
      matchId,
      homeTeam,
      awayTeam,
      homeTeamScore,
      awayTeamScore,
      matchDate: matchDate ? new Date(matchDate) : undefined,
      matchStatus,
      matchStage,
      hasExtraTime,
      hasPenalties,
      penaltyHomeScore,
      penaltyAwayScore,
      stadium,
    });

    return reply.status(200).send({
      match,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof MatchUpdateError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({
        message: 'Validation error',
        issues: error.format(),
      });
    }

    throw error; // Re-throw to be handled by global error handler
  }
}
