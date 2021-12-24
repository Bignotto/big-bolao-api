import { Connection, createConnection, getConnectionOptions } from 'typeorm';

export default async (): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  console.log('load type orm -------------------------------------');
  return createConnection(
    Object.assign(defaultOptions, {
      //host: process.env.NODE_ENV === 'test' ? 'localhost' : 'database',
      host: 'localhost',
      database:
        process.env.NODE_ENV === 'test'
          ? 'bolao_test'
          : defaultOptions.database,
    }),
  );
};
