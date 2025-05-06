import { ResourceNotFoundError } from '@/global/errors/ResourceNotFoundError';
import { makeUpdateUserUseCase } from '@/useCases/users/factory/makeUpdateUserUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

interface UpdateUserControllerRequest {
  userId: string;
  email?: string;
  fullName?: string;
  profileImageUrl?: string;
}

export async function UpdateUserController(
  request: FastifyRequest<{
    Params: { userId: string };
    Body: UpdateUserControllerRequest;
  }>,
  reply: FastifyReply
) {
  const updateUserParamsSchema = z.object({
    userId: z.string().cuid(),
  });

  const updateUserBodySchema = z.object({
    email: z.string().email().optional(),
    fullName: z.string().optional(),
    profileImageUrl: z.string().optional(),
  });

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
      return reply.status(422).send({ message: 'Validation error.', issues: error.format() });
    }

    console.log('CONTROLLER', JSON.stringify(error, null, 2));

    throw error;
  }
}
