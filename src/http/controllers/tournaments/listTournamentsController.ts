import { PrismaTournamentsRepository } from '@/repositories/tournaments/PrismaTournamentsRepository';
import { ListTournamentsUseCase } from '@/useCases/tournaments/listTournamentsUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function listTournamentsController(request: FastifyRequest, reply: FastifyReply) {
  const tournamentsRepository = new PrismaTournamentsRepository();
  const listTournamentsUseCase = new ListTournamentsUseCase(tournamentsRepository);

  const { tournaments } = await listTournamentsUseCase.execute();

  return reply.status(200).send({ tournaments });
}
