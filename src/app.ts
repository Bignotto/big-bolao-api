import 'reflect-metadata';
//import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/', (request, response) =>
  response.status(200).json({
    application: 'Bolão da Copa',
    description: 'Bolão da Copa API',
    author: 'Thiago Bignotto',
    contact: 'bignotto@gmail.com',
  }),
);

export { app };
