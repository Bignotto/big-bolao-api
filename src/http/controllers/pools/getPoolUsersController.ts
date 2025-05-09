import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetPoolUsersUseCase } from '@/useCases/pools/factory/makeGetPoolUsersUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function getPoolUsersController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const getPoolUsersParamsSchema = z.object({
      poolId: z.coerce.number(),
    });

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

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error.', issues: error.format() });
    }

    console.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }
}
