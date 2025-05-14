import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeGetUserPoolsUseCase } from '@/useCases/pools/factory/makeGetUserPoolsUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function getUserPoolsContoller(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.sub;

    const getUserPoolsUseCase = makeGetUserPoolsUseCase();
    const { pools } = await getUserPoolsUseCase.execute({
      userId,
    });

    return reply.status(200).send({
      pools,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}
