import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { NotPoolCreatorError } from '@/useCases/pools/errors/NotPoolCreatorError';
import { makeUpdatePoolUseCase } from '@/useCases/pools/factory/makeUpdatePoolUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

export async function updatePoolController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const updatePoolParamsSchema = z.object({
      poolId: z.coerce.number(),
    });

    const updatePoolBodySchema = z.object({
      name: z.string().min(3).optional(),
      description: z.string().optional(),
      isPrivate: z.boolean().optional(),
      maxParticipants: z.number().optional(),
      registrationDeadline: z.date().optional(),
    });

    const { poolId } = updatePoolParamsSchema.parse(request.params);
    const { name, description, isPrivate, maxParticipants, registrationDeadline } =
      updatePoolBodySchema.parse(request.body);

    const userId = request.user.sub;

    const updatePoolUseCase = makeUpdatePoolUseCase();

    const updatedPool = await updatePoolUseCase.execute({
      poolId,
      userId,
      name,
      description,
      isPrivate,
      maxParticipants,
      registrationDeadline,
    });

    return reply.status(200).send({
      pool: updatedPool,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    if (error instanceof NotPoolCreatorError) {
      return reply.status(403).send({ message: error.message });
    }

    console.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }
}
