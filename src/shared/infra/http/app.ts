import 'reflect-metadata';
import 'express-async-errors';
//import "dotenv/config";

import express, { NextFunction, Request, Response } from 'express';
import createConnection from '../typeorm';

import { usersRoutes } from './routes/users.routes';
import { AppError } from '@shared/errors/AppError';

import '@shared/container';

createConnection();

const app = express();

app.use(express.json());

app.use('/users', usersRoutes);

app.get('/', (request, response) =>
  response.status(200).json({
    application: 'Bolão da Copa',
    description: 'Bolão da Copa API',
    author: 'Thiago Bignotto',
    contact: 'bignotto@gmail.com',
  }),
);

app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof AppError) {
      return response.status(err.statusCode).json({
        message: err.message,
      });
    }
    return response.status(500).json({
      status: 'error',
      message: `Internal server error - ${err.message}`,
      err,
    });
  },
);

export { app };
