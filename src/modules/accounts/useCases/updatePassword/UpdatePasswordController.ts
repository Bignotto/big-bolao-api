import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { UpdatePasswordUseCase } from './UpdatePasswordUseCase';

class UpdatePasswordController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { newPassword, password } = request.body;
    const { id } = request.user;

    const updatePassword = container.resolve(UpdatePasswordUseCase);
    const result = await updatePassword.execute({
      newPassword,
      password,
      userId: id,
    });

    return response.status(201).json({ message: 'Updated good!' });
  }
}

export { UpdatePasswordController };
