import { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '@/env/config';

import { verifyAdminRole } from './verifyAdminRole';
import { verifySupabaseToken } from './verifySupabaseToken';

export async function verifyAdminOrSyncSecret(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const secret = env.SYNC_API_SECRET;
  if (secret && request.headers.authorization === `Bearer ${secret}`) {
    return;
  }
  await verifySupabaseToken(request, reply);
  if (reply.sent) return;
  await verifyAdminRole(request, reply);
}
