import { env } from '@/env/config';
import { supabase } from '@/lib/supabase';
import { FastifyInstance } from 'fastify';
import request from 'supertest';

export async function getSupabaseAccessToken(app: FastifyInstance) {
  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD,
  });

  if (error) {
    throw new Error(`Failed to get access token: ${error.message}`);
  }
  if (!session) {
    throw new Error('No session found');
  }

  const response = await request(app.server)
    .post('/users')
    .set('Authorization', `Bearer ${session.access_token}`)
    .send({
      id: session.user.id,
      passwordHash: 'fake-hash',
      fullName: 'John Tester',
      email: env.TEST_USER_EMAIL,
      accountProvider: 'EMAIL',
      profileImageUrl: 'https://example.com/profile.jpg',
    });

  const returnData: {
    token: string;
    userId: string;
  } = { token: session.access_token, userId: response.body.user.id };

  return returnData;
}

export function generateMockJWT(payload = {}) {
  const defaultPayload = {
    sub: '123456789',
    role: 'authenticated',
    email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const finalPayload = { ...defaultPayload, ...payload };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(finalPayload)).toString('base64');
  const signature = env.THE_APP_SECRET;

  return `${header}.${body}.${signature}`;
}
