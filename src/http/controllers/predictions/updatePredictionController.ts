import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InvalidScoreError } from '@/useCases/predictions/error/InvalidScoreError';
import { MatchStatusError } from '@/useCases/predictions/error/MatchStatusError';
import { PredictionError } from '@/useCases/predictions/error/PredictionError';
import { makeUpdatePredictionUseCase } from '@/useCases/predictions/factories/makeUpdatePredictionUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function updatePredictionController(
  request: FastifyRequest<{
    Params: {
      predictionId: string;
    };
    Body: {
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
  const updatePredictionParamsSchema = z.object({
    predictionId: z.coerce.number(),
  });

  const updatePredictionBodySchema = z.object({
    predictedHomeScore: z.number().min(0),
    predictedAwayScore: z.number().min(0),
    predictedHasExtraTime: z.boolean().default(false),
    predictedHasPenalties: z.boolean().default(false),
    predictedPenaltyHomeScore: z.number().optional(),
    predictedPenaltyAwayScore: z.number().optional(),
  });

  try {
    const { predictionId } = updatePredictionParamsSchema.parse(request.params);

    const {
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore,
      predictedPenaltyAwayScore,
    } = updatePredictionBodySchema.parse(request.body);

    const userId = request.user.sub;

    const updatePredictionUseCase = makeUpdatePredictionUseCase();

    const prediction = await updatePredictionUseCase.execute({
      predictionId,
      userId,
      predictedHomeScore,
      predictedAwayScore,
      predictedHasExtraTime,
      predictedHasPenalties,
      predictedPenaltyHomeScore,
      predictedPenaltyAwayScore,
    });

    return reply.status(200).send({
      prediction,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
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
      return reply.status(422).send({ message: 'Validation error.', issues: error.format() });
    }

    console.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }
}
