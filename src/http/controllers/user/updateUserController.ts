import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeUpdateUserUseCase } from '@/useCases/users/factory/makeUpdateUserUseCase';

const updateUserParamsSchema = z.object({
  userId: z.string().cuid(),
});

const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;
type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export async function updateUserController(
  request: FastifyRequest<{ Params: UpdateUserParams; Body: UpdateUserBody }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = updateUserParamsSchema.parse(request.params);
    const { email, fullName, profileImageUrl } = updateUserBodySchema.parse(request.body);

    const updateUserUseCase = makeUpdateUserUseCase();

    const user = await updateUserUseCase.execute({
      userId,
      email,
      fullName,
      profileImageUrl,
    });

    return reply.status(200).send({
      user,
    });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
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
