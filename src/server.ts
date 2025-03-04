import { createServer } from './app';

const start = async () => {
    const server = await createServer();

    try {
        const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        const host = process.env.HOST || '0.0.0.0';

        await server.listen({ port, host });

        console.log(`Server is running on ${host}:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();