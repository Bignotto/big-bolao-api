import { FastifyReply, FastifyRequest } from 'fastify';

export async function verifyJwt(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    if (!request.headers.authorization) {
      throw new Error('Missing authorization header');
    }

    const payload = await request.jwtVerify();

    request.user = {
      sub: (payload as { sub: string }).sub,
    };
  } catch {
    await reply.status(401).send({ message: 'Unauthorized.' });
  }
}
