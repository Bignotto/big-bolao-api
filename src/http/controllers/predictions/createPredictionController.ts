import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InvalidScoreError } from '@/useCases/predictions/error/InvalidScoreError';
import { MatchStatusError } from '@/useCases/predictions/error/MatchStatusError';
import { NotParticipantError } from '@/useCases/predictions/error/NotParticipantError';
import { PredictionError } from '@/useCases/predictions/error/PredictionError';
import { makeCreatePredictionUseCase } from '@/useCases/predictions/factories/makeCreatePredictionUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function createPredictionController(
  request: FastifyRequest<{
    Body: {
      matchId: number;
      poolId: number;
      predictedHomeScore: number;
      predictedAwayScore: number;
      predictedHasExtraTime?: boolean;
      predictedHasPenalties?: boolean;
      predictedPenaltyHomeScore?: number;
      predictedPenaltyAwayScore?: number;
    };
  }>,
  reply: FastifyReply
) {
  const createPredictionBodySchema = z.object({
    matchId: z.number(),
    poolId: z.number(),
    predictedHomeScore: z.number().min(0),
    predictedAwayScore: z.number().min(0),
    predictedHasExtraTime: z.boolean().default(false),
    predictedHasPenalties: z.boolean().default(false),
    predictedPenaltyHomeScore: z.number().optional(),
    predictedPenaltyAwayScore: z.number().optional(),
  });

  try {
    const {
      matchId,
      poolId,
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore,
      predictedPenaltyAwayScore,
    } = createPredictionBodySchema.parse(request.body);

    const userId = request.user.sub;

    const createPredictionUseCase = makeCreatePredictionUseCase();

    const prediction = await createPredictionUseCase.execute({
      userId,
      matchId,
      poolId,
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore,
      predictedPenaltyAwayScore,
    });

    return reply.status(201).send({
      prediction,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof NotParticipantError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof InvalidScoreError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof MatchStatusError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof PredictionError) {
      return reply.status(409).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    console.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }
}
