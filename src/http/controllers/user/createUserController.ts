import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { EmailInUseError } from '../../../global/errors/EmailInUseError';
import { makeCreateUserUseCase } from '../../../useCases/users/factory/makeCreateUserUseCase';

interface CreateUserControllerRequest {
  email: string;
  passwordHash: string;
  fullName: string;
  profileImageUrl: string;
}

interface CreateUserControllerResponse {
  id: string;
  email: string;
  fullName: string;
  profileImageUrl: string;
}

export async function CreateUserController(
  request: FastifyRequest<{
    Body: CreateUserControllerRequest;
  }>,
  reply: FastifyReply
) {
  const createUserBodySchema = z.object({
    email: z.string().email(),
    passwordHash: z.string(),
    fullName: z.string(),
    profileImageUrl: z.string(),
  });

  const { email, passwordHash, fullName, profileImageUrl } = createUserBodySchema.parse(
    request.body
  );

  try {
    const createUserUseCase = makeCreateUserUseCase();

    const user = await createUserUseCase.execute({
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

    throw error;
  }
}
