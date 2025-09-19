import { config } from 'dotenv';
// import 'dotenv/config';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
} else {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'production', 'test']).default('dev'),
  THE_APP_NAME: z.string(),
  THE_APP_SECRET: z.string(),
  THE_APP_VERSION: z.string(),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  TEST_USER_PASSWORD: z.string().optional(),
  TEST_USER_EMAIL: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'test') {
    if (!data.TEST_USER_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TEST_USER_EMAIL is required when NODE_ENV is test',
        path: ['TEST_USER_EMAIL'],
      });
    }
    if (!data.TEST_USER_PASSWORD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TEST_USER_PASSWORD is required when NODE_ENV is test',
        path: ['TEST_USER_PASSWORD'],
      });
    }
  }
});

const _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  process.stderr.write(`invalid environment variables: ${JSON.stringify(_env.error.format())}\n`);
  throw new Error('invalid environment variables');
}

export const env = _env.data;
