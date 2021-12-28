import { Request, Response } from 'express';
import { User } from '../../entities/User';
import { UserTypeOrmRepository } from '../../repositories/typeorm/UserTypeOrmRepository';
import { CreateUserUseCase } from './CreateUserUseCase';

class CreateUserController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password } = request.body;

    const createUserUseCase = new CreateUserUseCase(
      new UserTypeOrmRepository(),
    );
    let user: User;

    try {
      user = await createUserUseCase.execute({ name, email, password });
    } catch (error) {
      return response.status(500).json({ error });
    }
    return response.status(201).json(user);
  }
}

export { CreateUserController };
