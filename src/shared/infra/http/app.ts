import 'reflect-metadata';
//import "dotenv/config";
import express from 'express';
import { usersRoutes } from './routes/users.routes';
import createConnection from '../typeorm';

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

export { app };
