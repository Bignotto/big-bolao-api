import { User } from '../entities/User';
import { IUserResponseDTO } from '../dtos/UserResponseDTO';
import { instanceToInstance } from 'class-transformer';

class UserMap {
  static toDto({
    id,
    name,
    email,
    avatar,
    profile,
    favTeam,
    created_at,
  }: User): IUserResponseDTO {
    const user = instanceToInstance({
      id,
      name,
      email,
      avatar,
      profile,
      favTeam,
      created_at,
    });
    return user;
  }
}

export { UserMap };
