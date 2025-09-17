import { FastifyReply, FastifyRequest } from 'fastify';

import { supabase } from '@/lib/supabase';

export async function verifySupabaseToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      throw error || new Error('Invalid token');
    }

    request.user = { sub: data.user.id };
  } catch {
    await reply.status(401).send({ message: 'Unauthorized.' });
  }
}
