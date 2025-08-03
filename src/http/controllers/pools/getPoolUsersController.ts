import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotParticipantError } from '@/useCases/pools/errors/NotParticipantError';
import { makeGetPoolUsersUseCase } from '@/useCases/pools/factory/makeGetPoolUsersUseCase';

const getPoolUsersParamsSchema = z.object({
  poolId: z.coerce.number(),
});

type GetPoolUsersParams = z.infer<typeof getPoolUsersParamsSchema>;

export async function getPoolUsersController(
  request: FastifyRequest<{ Params: GetPoolUsersParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { poolId } = getPoolUsersParamsSchema.parse(request.params);

    const userId = request.user.sub;

    const getPoolUsersUseCase = makeGetPoolUsersUseCase();

    const users = await getPoolUsersUseCase.execute({
      poolId,
      userId,
    });

    return reply.status(200).send({
      users,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof NotParticipantError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error.', issues: error.format() });
    }

    throw error; // Re-throw unexpected errors to be handled by the global error handler
  }
}
