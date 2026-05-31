import { FastifyReply, FastifyRequest } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyAdminOrSyncSecret } from './verifyAdminOrSyncSecret';

vi.mock('@/env/config', () => ({
  env: { SYNC_API_SECRET: 'test-sync-secret' },
}));

vi.mock('./verifyAdminRole', () => ({
  verifyAdminRole: vi.fn(),
}));

vi.mock('./verifySupabaseToken', () => ({
  verifySupabaseToken: vi.fn(),
}));

import { verifyAdminRole } from './verifyAdminRole';
import { verifySupabaseToken } from './verifySupabaseToken';

function makeRequest(authorization?: string): FastifyRequest {
  return {
    headers: { authorization },
    user: { sub: 'user-id' },
  } as unknown as FastifyRequest;
}

function makeReply(): FastifyReply {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

describe('verifyAdminOrSyncSecret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes immediately when sync secret matches', async () => {
    const request = makeRequest('Bearer test-sync-secret');
    const reply = makeReply();

    await verifyAdminOrSyncSecret(request, reply);

    expect(verifyAdminRole).not.toHaveBeenCalled();
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('runs Supabase token check then verifyAdminRole when sync secret is wrong', async () => {
    const request = makeRequest('Bearer wrong-secret');
    const reply = makeReply();

    await verifyAdminOrSyncSecret(request, reply);

    expect(verifySupabaseToken).toHaveBeenCalledWith(request, reply);
    expect(verifyAdminRole).toHaveBeenCalledWith(request, reply);
  });

  it('runs Supabase token check then verifyAdminRole when Authorization header is absent', async () => {
    const request = makeRequest(undefined);
    const reply = makeReply();

    await verifyAdminOrSyncSecret(request, reply);

    expect(verifySupabaseToken).toHaveBeenCalledWith(request, reply);
    expect(verifyAdminRole).toHaveBeenCalledWith(request, reply);
  });

  it('skips verifyAdminRole when verifySupabaseToken already sent a reply', async () => {
    const request = makeRequest('Bearer bad-token');
    const reply = { ...makeReply(), sent: true } as unknown as FastifyReply;
    vi.mocked(verifySupabaseToken).mockImplementationOnce(async () => {});

    await verifyAdminOrSyncSecret(request, reply);

    expect(verifySupabaseToken).toHaveBeenCalled();
    expect(verifyAdminRole).not.toHaveBeenCalled();
  });
});
