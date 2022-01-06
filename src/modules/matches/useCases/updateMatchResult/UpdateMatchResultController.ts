import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UpdateMatchResultUseCase } from './UpdateMatchResultUseCase';

class UpdateMatchResultController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { param1, param2 } = request.body;

    const updateMatchResult = container.resolve(UpdateMatchResultUseCase);
    const result = await updateMatchResult.execute();

    return response.status(201).json(result);
  }
}

export { UpdateMatchResultController };
