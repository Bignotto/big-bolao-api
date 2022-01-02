import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreateGroupUseCase } from './CreateGroupUseCase';

class CreateGroupController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { description, password } = request.body;
    const { id } = request.user;

    const createGroup = container.resolve(CreateGroupUseCase);
    const result = await createGroup.execute({
      description,
      password,
      owner_id: id,
    });

    return response.status(201).json(result);
  }
}

export { CreateGroupController };
