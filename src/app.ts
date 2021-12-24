import 'reflect-metadata';
//import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import { CreateUserController } from './modules/accounts/useCases/createUser/CreateUserController';

import createConnection from './shared/infra/typeorm';

createConnection();

const app = express();
const createUserController = new CreateUserController();

app.use(express.json());

app.get('/', (request, response) =>
  response.status(200).json({
    application: 'Bolão da Copa',
    description: 'Bolão da Copa API',
    author: 'Thiago Bignotto',
    contact: 'bignotto@gmail.com',
  }),
);

app.post('/users', createUserController.handle);
export { app };
