import { Request, Response } from 'express';
import { User } from '../../entities/User';
import { UserPrismaRepository } from '../../repositories/prisma/UserPrismaRepository';
import { CreateUserUseCase } from './CreateUserUseCase';

class CreateUserController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body;

    const createUserUseCase = new CreateUserUseCase(new UserPrismaRepository());
    let user: User;

    try {
      user = await createUserUseCase.execute({ name, email, password });
    } catch (error) {
      return response.status(500).json(error.code);
    }
    return response.status(201).json(user);
  }
}

export { CreateUserController };
