import { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '@/env/config';

import { verifySupabaseToken } from './verifySupabaseToken';

export async function verifyUserOrSyncSecret(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const secret = env.SYNC_API_SECRET;
  if (secret && request.headers.authorization === `Bearer ${secret}`) {
    return;
  }
  await verifySupabaseToken(request, reply);
}
