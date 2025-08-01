import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeJoinPoolByInviteUseCase } from '@/useCases/pools/factory/makeJoinPoolByInviteUseCase';

const joinPoolByInviteBodySchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export async function joinPoolByInviteController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.user.sub;
    const { inviteCode } = joinPoolByInviteBodySchema.parse(request.body);

    const joinPoolByInviteUseCase = makeJoinPoolByInviteUseCase();

    const pool = await joinPoolByInviteUseCase.execute({
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
