import auth from '@config/auth';
import { GetUserRepository } from '@shared/container/GetUserRepository';
import { AppError } from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { container } from 'tsyringe';

interface IPayload {
  sub: string;
}

export async function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader) throw new AppError('No headers? No data!');

  const [, token] = authHeader.split(' ');

  try {
    const { sub: user_id } = verify(token, auth.secret) as IPayload;
    const repository = container.resolve(GetUserRepository).getRepository();

    const found = repository.findById(user_id);
    if (!found) throw new AppError('Invalid User Credentials.');

    request.user = {
      id: user_id,
    };

    next();
  } catch (error) {
    throw new AppError(error);
  }
}
