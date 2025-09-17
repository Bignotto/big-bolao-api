// test/test-helpers.ts
import { FastifyInstance } from 'fastify';

import { createServer } from '@/app';

let app: FastifyInstance | null = null;

export async function createTestApp(): Promise<FastifyInstance> {
  if (app) {
    return app;
  }

  try {
    app = await createServer();

    // Aguarda a aplicação estar pronta
    await app.ready();

    return app;
  } catch (error) {
    process.stderr.write(`❌ Failed to create test app: ${String(error)}\n`);
    throw error;
  }
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    try {
      await app.close();
      app = null;
    } catch (error) {
      process.stderr.write(`❌ Failed to close test app: ${String(error)}\n`);
      // Não throw aqui para não falhar o cleanup
    }
  }
}

// Função para limpar recursos entre testes
export async function resetTestApp(): Promise<void> {
  await closeTestApp();
  app = null;
}

// Função para obter a instância atual do app (útil para debug)
export function getTestApp(): FastifyInstance | null {
  return app;
}
