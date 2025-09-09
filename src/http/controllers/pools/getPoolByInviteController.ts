import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetPoolByInviteUseCase } from '@/useCases/pools/factory/makeGetPoolByInviteUseCase';

const getPoolByInviteParamsSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

export async function getPoolByInviteController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { inviteCode } = getPoolByInviteParamsSchema.parse(request.params);

    const getPoolByInviteUseCase = makeGetPoolByInviteUseCase();
    const pool = await getPoolByInviteUseCase.execute({ inviteCode });

    return reply.status(200).send({ pool });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    throw error;
  }
}
