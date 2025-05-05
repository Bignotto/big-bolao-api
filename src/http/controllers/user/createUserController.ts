import { EmailInUseError } from '@/global/errors/EmailInUseError';
import { makeCreateUserUseCase } from '@/useCases/users/factory/makeCreateUserUseCase';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

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

  try {
    const { email, passwordHash, fullName, profileImageUrl } = createUserBodySchema.parse(
      request.body
    );

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

    if (error instanceof z.ZodError) {
      return reply.status(422).send({ message: 'Validation error' });
    }

    //TODO: should return better info about what data are missing or invalid

    throw error;
  }
}
