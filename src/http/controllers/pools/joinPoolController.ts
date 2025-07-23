import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeJoinPoolUseCase } from '@/useCases/pools/factory/makeJoinPoolUseCase';

const joinPoolBodySchema = z.object({
  poolId: z.number(),
  inviteCode: z.string().optional(),
});

type JoinPoolBody = z.infer<typeof joinPoolBodySchema>;

export async function joinPoolController(
  request: FastifyRequest<{ Body: JoinPoolBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { poolId, inviteCode } = joinPoolBodySchema.parse(request.body);
    const userId = request.user.sub;

    const joinPoolUseCase = makeJoinPoolUseCase();

    const pool = await joinPoolUseCase.execute({
      poolId,
      inviteCode,
      userId,
    });

    return reply.status(200).send({
      pool: {
        id: pool.id,
        name: pool.name,
        isPrivate: pool.isPrivate,
      },
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(401).send({ message: error.message });
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
