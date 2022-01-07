import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UpdateMatchResultUseCase } from './UpdateMatchResultUseCase';

class UpdateMatchResultController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { home_team_score, away_team_score } = request.body;
    const { match_id } = request.params;

    const updateMatchResult = container.resolve(UpdateMatchResultUseCase);
    const result = await updateMatchResult.execute({
      match_id: parseInt(match_id),
      home_team_score,
      away_team_score,
    });

    return response.status(201).json(result);
  }
}

export { UpdateMatchResultController };
