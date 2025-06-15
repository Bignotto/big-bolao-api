import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserInfoUseCase } from '@/useCases/users/factory/makeGetUserInfoUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function GetLoggedUserInfoController(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user.sub;

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
