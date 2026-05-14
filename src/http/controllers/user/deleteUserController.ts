import { FastifyReply, FastifyRequest } from 'fastify';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeDeleteUserUseCase } from '@/useCases/users/factory/makeDeleteUserUseCase';

export async function deleteUserController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.user.sub;

    const deleteUserUseCase = makeDeleteUserUseCase();
    await deleteUserUseCase.execute(userId);

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
