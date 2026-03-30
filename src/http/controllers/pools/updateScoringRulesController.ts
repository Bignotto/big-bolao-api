import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotPoolCreatorError } from '@/useCases/pools/errors/NotPoolCreatorError';
import { makeUpdateScoringRulesUseCase } from '@/useCases/pools/factory/makeUpdateScoringRulesUseCase';

const updateScoringRulesParamsSchema = z.object({
  poolId: z.coerce.number(),
});

const updateScoringRulesBodySchema = z.object({
  exactScorePoints: z.number().int().positive().optional(),
  correctWinnerGoalDiffPoints: z.number().int().positive().optional(),
  correctWinnerPoints: z.number().int().positive().optional(),
  correctDrawPoints: z.number().int().positive().optional(),
  specialEventPoints: z.number().int().nonnegative().optional(),
  knockoutMultiplier: z.number().min(1).optional(),
  finalMultiplier: z.number().min(1).optional(),
});

type UpdateScoringRulesParams = z.infer<typeof updateScoringRulesParamsSchema>;
type UpdateScoringRulesBody = z.infer<typeof updateScoringRulesBodySchema>;

export async function updateScoringRulesController(
  request: FastifyRequest<{ Params: UpdateScoringRulesParams; Body: UpdateScoringRulesBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { poolId } = updateScoringRulesParamsSchema.parse(request.params);
    const {
      exactScorePoints,
      correctWinnerGoalDiffPoints,
      correctWinnerPoints,
      correctDrawPoints,
      specialEventPoints,
      knockoutMultiplier,
      finalMultiplier,
    } = updateScoringRulesBodySchema.parse(request.body);

    const userId = request.user.sub;

    const updateScoringRulesUseCase = makeUpdateScoringRulesUseCase();

    const scoringRules = await updateScoringRulesUseCase.execute({
      poolId,
      userId,
      exactScorePoints,
      correctWinnerGoalDiffPoints,
      correctWinnerPoints,
      correctDrawPoints,
      specialEventPoints,
      knockoutMultiplier,
      finalMultiplier,
    });

    return reply.status(200).send({ scoringRules });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof NotPoolCreatorError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({
        message: 'Validation error',
        issues: error.format(),
      });
    }

    throw error;
  }
}
