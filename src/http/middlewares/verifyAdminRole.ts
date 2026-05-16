import { AccountRole } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

import { PrismaUsersRepository } from '@/repositories/users/PrismaUsersRepository';

export async function verifyAdminRole(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const usersRepository = new PrismaUsersRepository();
  const user = await usersRepository.findById(request.user.sub);

  if (!user || user.role !== AccountRole.ADMIN) {
    await reply.status(403).send({ message: 'Forbidden.' });
  }
}
