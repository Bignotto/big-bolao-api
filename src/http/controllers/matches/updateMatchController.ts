import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { MatchUpdateError } from '@/useCases/matches/errors/MatchUpdateError';
import { makeUpdateMatchUseCase } from '@/useCases/matches/factories/makeUpdateMatchUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function updateMatchController(
  request: FastifyRequest<{
    Params: { matchId: string };
    Body: {
      homeTeam?: number;
      awayTeam?: number;
      homeScore?: number;
      awayScore?: number;
      matchDate?: string;
      matchStatus?: string;
      matchStage?: string;
      hasExtraTime?: boolean;
      hasPenalties?: boolean;
      penaltyHomeScore?: number;
      penaltyAwayScore?: number;
      stadium?: string;
    };
  }>,
  reply: FastifyReply
) {
  const updateMatchParamsSchema = z.object({
    matchId: z.coerce.number(),
  });

  const updateMatchBodySchema = z.object({
    homeTeam: z.number().optional(),
    awayTeam: z.number().optional(),
    homeScore: z.number().optional(),
    awayScore: z.number().optional(),
    matchDate: z.string().datetime().optional(),
    matchStatus: z
      .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED'])
      .optional(),
    matchStage: z
      .enum(['GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'])
      .optional(),
    hasExtraTime: z.boolean().optional(),
    hasPenalties: z.boolean().optional(),
    penaltyHomeScore: z.number().optional(),
    penaltyAwayScore: z.number().optional(),
    stadium: z.string().optional(),
  });

  const { matchId } = updateMatchParamsSchema.parse(request.params);
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    matchDate,
    matchStatus,
    matchStage,
    hasExtraTime,
    hasPenalties,
    penaltyHomeScore,
    penaltyAwayScore,
    stadium,
  } = updateMatchBodySchema.parse(request.body);

  try {
    const updateMatchUseCase = makeUpdateMatchUseCase();

    const match = await updateMatchUseCase.execute({
      matchId,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      matchDate: matchDate ? new Date(matchDate) : undefined,
      matchStatus: matchStatus as any,
      matchStage: matchStage as any,
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

    throw error;
  }
}
