import { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyUserOrSyncSecret } from './verifyUserOrSyncSecret';
import { verifySupabaseToken } from './verifySupabaseToken';

vi.mock('@/env/config', () => ({
  env: { SYNC_API_SECRET: 'test-sync-secret' },
}));

vi.mock('./verifySupabaseToken', () => ({
  verifySupabaseToken: vi.fn(),
}));

function makeRequest(authorization?: string): FastifyRequest {
  return {
    headers: { authorization },
  } as unknown as FastifyRequest;
}

function makeReply(): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;
}

describe('verifyUserOrSyncSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes immediately when sync secret matches', async () => {
    const request = makeRequest('Bearer test-sync-secret');
    const reply = makeReply();

    await verifyUserOrSyncSecret(request, reply);

    expect(verifySupabaseToken).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('calls verifySupabaseToken when sync secret is wrong', async () => {
    const request = makeRequest('Bearer wrong-secret');
    const reply = makeReply();

    await verifyUserOrSyncSecret(request, reply);

    expect(verifySupabaseToken).toHaveBeenCalledWith(request, reply);
  });

  it('calls verifySupabaseToken when Authorization header is absent', async () => {
    const request = makeRequest(undefined);
    const reply = makeReply();

    await verifyUserOrSyncSecret(request, reply);

    expect(verifySupabaseToken).toHaveBeenCalledWith(request, reply);
  });
});
