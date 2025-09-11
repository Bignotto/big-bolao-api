import { Team } from '@prisma/client';

import { ITeamsRepository } from '@/repositories/teams/ITeamsRepository';

interface ICreateTeamRequest {
  name: string;
  countryCode?: string;
  flagUrl?: string;
}

export class CreateTeamUseCase {
  constructor(private teamsRepository: ITeamsRepository) {}

  async execute({ name, countryCode, flagUrl }: ICreateTeamRequest): Promise<Team> {
    // Check if team with same name already exists
    const existingTeam = await this.teamsRepository.findByName(name);

    if (existingTeam) {
      throw new Error('Team with this name already exists');
    }

    const team = await this.teamsRepository.create({
      name,
      countryCode,
      flagUrl,
    });

    return team;
  }
}
