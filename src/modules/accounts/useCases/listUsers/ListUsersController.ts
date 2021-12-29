import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { ListUsersUseCase } from './ListUsersUseCase';

class LisUsersController {
  async handle(_request: Request, response: Response): Promise<Response> {
    const listUsersUseCase = container.resolve(ListUsersUseCase);
    const user = await listUsersUseCase.execute();

    return response.status(201).json(user);
  }
}

export { LisUsersController };
