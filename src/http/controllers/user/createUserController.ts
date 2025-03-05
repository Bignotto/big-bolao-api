import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { EmailInUseError } from '../../../global/errors/EmailInUseError';
import { makeCreateUserUseCase } from '../../../useCases/users/factory/makeCreateUserUseCase';

interface CreateUserControllerRequest {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  profileImageUrl: string;
}

interface CreateUserControllerResponse {
  id: string;
  username: string;
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
    username: z.string(),
    email: z.string().email(),
    passwordHash: z.string(),
    fullName: z.string(),
    profileImageUrl: z.string(),
  });

  const { username, email, passwordHash, fullName, profileImageUrl } = createUserBodySchema.parse(
    request.body
  );

  try {
    const createUserUseCase = makeCreateUserUseCase();

    const user = await createUserUseCase.execute({
      username,
      email,
      passwordHash,
      fullName,
      profileImageUrl,
    });

    return reply.status(201).send({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    if (error instanceof EmailInUseError) {
      return reply.status(409).send({ message: error.message });
    }

    throw error;
  }
}
