import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeLeavePoolUseCase } from '@/useCases/pools/factory/makeLeavePoolUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function leavePoolController(request: FastifyRequest, reply: FastifyReply) {
  const leavePoolParamsSchema = z.object({
    poolId: z.coerce.number(),
  });

  try {
    const { poolId } = leavePoolParamsSchema.parse(request.params);
    const userId = request.user.sub;
    const leavePoolUseCase = makeLeavePoolUseCase();
    await leavePoolUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof NotParticipantError) {
      return reply.status(403).send({ message: error.message });
    }
    if (error instanceof UnauthorizedError) {
      return reply.status(403).send({ message: error.message });
    }

    console.log(JSON.stringify(error, null, 2));
    return reply.status(500).send({ message: 'Internal server error' });
  }
}
