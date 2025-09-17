import { createServer } from './app';

const start = async () => {
  const server = await createServer();

  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    server.log.info(`Server is running on ${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start().catch((err) => {
  // Use stderr to avoid console usage per lint rules
  process.stderr.write(`Failed to start the server: ${String(err)}\n`);
  process.exit(1);
});
