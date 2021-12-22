import { Request, Response } from 'express';
import { UserPrismaRepository } from '../../repositories/prisma/UserPrismaRepository';
import { CreateUserUseCase } from './CreateUserUseCase';

class CreateUserController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body;

    const createUserUseCase = new CreateUserUseCase(new UserPrismaRepository());

    const user = await createUserUseCase.execute({ name, email, password });

    return response.status(201).json(user);
  }
}

export { CreateUserController };
