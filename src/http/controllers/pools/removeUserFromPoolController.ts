import { makeRemoveUserFromPoolUseCase } from '@/useCases/pools/factory/makeRemoveUserFromPoolUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function removeUserFromPoolController(request: FastifyRequest, reply: FastifyReply) {
  const removeUserFromPoolParamsSchema = z.object({
    poolId: z.coerce.number(),
    userId: z.string().uuid(),
  });

  const { poolId, userId: userIdToRemove } = removeUserFromPoolParamsSchema.parse(request.params);
  const creatorId = request.user.sub;

  try {
    const removeUserFromPoolUseCase = makeRemoveUserFromPoolUseCase();
    await removeUserFromPoolUseCase.execute({
      poolId,
      userIdToRemove,
      creatorId,
    });

    return reply.status(200).send();
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(400).send({ message: error.message });
    }

    return reply.status(500).send({ message: 'Internal server error' });
  }
}
