import auth from '@config/auth';
import { GetUserRepository } from '@shared/container/GetUserRepository';
import { AppError } from '@shared/errors/AppError';
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { container } from 'tsyringe';

interface IPayload {
  sub: string;
}

export async function ensureAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const { id } = request.user;
  if (!id) throw new AppError('No user found!', 401);

  const repository = container.resolve(GetUserRepository).getRepository();

  const found = await repository.findById(id);
  if (!found) throw new AppError('User id not found', 401);

  if (!found.isAdmin) throw new AppError('User is not admin', 403);

  next();
}
