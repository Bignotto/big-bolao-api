import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { PoolNameInUseError } from '@/useCases/pools/errors/PoolNameInUseError';
import { makeCreatePoolUseCase } from '@/useCases/pools/factory/makeCreatePoolUseCase';

const createPoolBodySchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  tournamentId: z.number(),
  isPrivate: z.boolean().default(false),
  maxParticipants: z.number().optional(),
  inviteCode: z.string().optional(),
  registrationDeadline: z.date().optional(),
});

type CreatePoolBody = z.infer<typeof createPoolBodySchema>;

export async function createPoolController(
  request: FastifyRequest<{ Body: CreatePoolBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const {
      name,
      tournamentId,
      description,
      isPrivate,
      inviteCode,
      registrationDeadline,
      maxParticipants,
    } = createPoolBodySchema.parse(request.body);

    const userId = request.user.sub;

    const createPoolUseCase = makeCreatePoolUseCase();

    const pool = await createPoolUseCase.execute({
      name,
      tournamentId,
      creatorId: userId,
      description,
      isPrivate,
      inviteCode,
      registrationDeadline,
      maxParticipants,
    });

    return reply.status(201).send({
      pool,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    if (error instanceof PoolNameInUseError) {
      return reply.status(409).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    console.error(error);
    //return reply.status(500).send({ message: 'Internal server error.' });
    throw error; // Re-throw to be handled by global error handler
  }
}
