import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreateGuessUseCase } from './CreateGuessUseCase';

class CreateGuessController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { match_id, home_team, away_team } = request.body;
    const { group_id } = request.params;
    const { id } = request.user;

    const createGuess = container.resolve(CreateGuessUseCase);
    const result = await createGuess.execute({
      user_id: id,
      group_id,
      match_id,
      home_team,
      away_team,
    });

    return response.status(201).json(result);
  }
}

export { CreateGuessController };
