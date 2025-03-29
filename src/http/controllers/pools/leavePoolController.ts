import { makeLeavePoolUseCase } from '@/useCases/pools/factory/makeLeavePoolUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function leavePoolController(request: FastifyRequest, reply: FastifyReply) {
  const leavePoolParamsSchema = z.object({
    poolId: z.coerce.number(),
  });

  const { poolId } = leavePoolParamsSchema.parse(request.params);
  const userId = request.user.sub;

  try {
    const leavePoolUseCase = makeLeavePoolUseCase();
    await leavePoolUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send();
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(400).send({ message: error.message });
    }

    return reply.status(500).send({ message: 'Internal server error' });
  }
}
