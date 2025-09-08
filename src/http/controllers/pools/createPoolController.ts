import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { InviteCodeInUseError } from '@/global/errors/InviteCodeInUseError';
import { InviteCodeRequiredError } from '@/useCases/pools/errors/InviteCodeRequiredError';
import { PoolNameInUseError } from '@/useCases/pools/errors/PoolNameInUseError';
import { makeCreatePoolUseCase } from '@/useCases/pools/factory/makeCreatePoolUseCase';

const createPoolBodySchema = z
  .object({
    name: z.string().min(3),
    description: z.string().optional(),
    tournamentId: z.number(),
    isPrivate: z.boolean().default(false),
    maxParticipants: z.number().optional(),
    inviteCode: z.string().optional(),
    registrationDeadline: z.date().optional(),
  })
  .refine(
    (data) => !data.isPrivate || !!data.inviteCode,
    {
      message: 'Invite code is required for private pools',
      path: ['inviteCode'],
    }
  );

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
    if (error instanceof InviteCodeInUseError) {
      return reply.status(409).send({ message: error.message });
    }
    if (error instanceof InviteCodeRequiredError) {
      return reply.status(422).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error', issues: error.format() });
    }

    throw error; // Re-throw to be handled by global error handler
  }
}
