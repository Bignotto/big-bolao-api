import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeRemoveUserFromPoolUseCase } from '@/useCases/pools/factory/makeRemoveUserFromPoolUseCase';

export async function removeUserFromPoolController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const removeUserFromPoolParamsSchema = z.object({
    poolId: z.coerce.number(),
    userId: z.string().cuid(),
  });

  try {
    const { poolId, userId: userIdToRemove } = removeUserFromPoolParamsSchema.parse(request.params);
    const creatorId = request.user.sub;

    const removeUserFromPoolUseCase = makeRemoveUserFromPoolUseCase();
    await removeUserFromPoolUseCase.execute({
      poolId,
      userIdToRemove,
      creatorId,
    });

    return reply
      .status(200)
      .send({ message: 'User successfully removed from pool' });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof UnauthorizedError) {
      return reply.status(403).send({ message: error.message });
    }
    if (error instanceof NotParticipantError) {
      return reply.status(403).send({ message: error.message });
    }

    throw error;
  }
}
