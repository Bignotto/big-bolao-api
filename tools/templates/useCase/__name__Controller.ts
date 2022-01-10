import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { __name__(pascalCase)UseCase } from './__name__(pascalCase)UseCase';

class __name__(pascalCase)Controller {
  async handle(request: Request, response: Response): Promise<Response> {
    const { param1, param2 } = request.body;

    const __name__(camelCase) = container.resolve(__name__(pascalCase)UseCase);
    const result = await __name__(camelCase).execute();

    return response.status(201).json(result);
  }
}

export { __name__(pascalCase)Controller };
