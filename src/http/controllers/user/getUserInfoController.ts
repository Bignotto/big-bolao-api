import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserInfoUseCase } from '@/useCases/users/factory/makeGetUserInfoUseCase';

export async function getUserInfoController(
  request: FastifyRequest<{
    Params: { userId: string };
  }>,
  reply: FastifyReply
): Promise<FastifyReply> {
  const getUserParamsSchema = z.object({
    userId: z.string(), //.cuid(),
  });

  const { userId } = getUserParamsSchema.parse(request.params);

  try {
    const getUserInfoUseCase = makeGetUserInfoUseCase();

    const user = await getUserInfoUseCase.execute({
      userId,
    });

    return reply.status(200).send({
      user,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
