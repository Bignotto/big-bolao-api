import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { EmailInUseError } from '@/global/errors/EmailInUseError';
import { makeCreateUserUseCase } from '@/useCases/users/factory/makeCreateUserUseCase';

const createUserBodySchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  passwordHash: z.string(),
  fullName: z.string(),
  profileImageUrl: z.string(),
});

type CreateUserBody = z.infer<typeof createUserBodySchema>;

export async function createUserController(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id, email, passwordHash, fullName, profileImageUrl } = createUserBodySchema.parse(
      request.body
    );

    const createUserUseCase = makeCreateUserUseCase();

    const user = await createUserUseCase.execute({
      id,
      email,
      passwordHash,
      fullName,
      profileImageUrl,
    });

    return reply.status(201).send({
      user,
    });
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return reply.status(409).send({ message: error.message });
    }

    if (error instanceof z.ZodError) {
      return reply.status(422).send({
        message: 'Validation error',
        issues: error.format(),
      });
    }

    throw error; // Re-throw to be handled by global error handler
  }
}
