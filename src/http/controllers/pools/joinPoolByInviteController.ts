import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { DeadlineError } from '@/useCases/pools/errors/DeadlineError';
import { MaxParticipantsError } from '@/useCases/pools/errors/MaxParticipantsError';
import { UnauthorizedError } from '@/useCases/pools/errors/UnauthorizedError';
import { makeJoinPoolByInviteUseCase } from '@/useCases/pools/factory/makeJoinPoolByInviteUseCase';

const joinPoolByInviteParamsSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export async function joinPoolByInviteController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.user.sub;
    const { inviteCode } = joinPoolByInviteParamsSchema.parse(request.params);

    const joinPoolByInviteUseCase = makeJoinPoolByInviteUseCase();

    const pool = await joinPoolByInviteUseCase.execute({
      inviteCode,
      userId,
    });

    return reply.status(200).send({ pool });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof MaxParticipantsError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof DeadlineError) {
      return reply.status(400).send({ message: error.message });
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
