import { FastifyReply, FastifyRequest } from 'fastify';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserPoolStandingUseCase } from '@/useCases/users/factory/makeGetUserPoolStandingUseCase';

export async function getUserPoolsStandingsController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get userId from authenticated user (following the pattern from getUserPredictionsController)
    const userId = request.user.sub;

    const getUserPoolStandingUseCase = makeGetUserPoolStandingUseCase();
    const { standing } = await getUserPoolStandingUseCase.execute({
      userId,
    });

    return reply.status(200).send({
      standing,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
