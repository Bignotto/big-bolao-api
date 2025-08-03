import { FastifyReply, FastifyRequest } from 'fastify';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeListTournamentsUseCase } from '@/useCases/tournaments/factories/makeListTournamentsUseCase';

export async function listTournamentsController(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const listTournamentsUseCase = makeListTournamentsUseCase();
    const { tournaments } = await listTournamentsUseCase.execute();

    return reply.status(200).send({ tournaments });
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}
