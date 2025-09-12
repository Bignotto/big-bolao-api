import { Prisma, Team } from '@prisma/client';

import { ITeamsRepository } from './ITeamsRepository';

export class InMemoryTeamsRepository implements ITeamsRepository {
  public items: Team[] = [];
  private tournamentTeams: { tournamentId: number; teamId: number; groupName?: string }[] = [];

  create(data: Prisma.TeamCreateInput): Promise<Team> {
    const team = {
      id: this.items.length + 1,
      name: data.name,
      countryCode: data.countryCode || null,
      flagUrl: data.flagUrl || null,
      createdAt: new Date(),
    } as Team;

    this.items.push(team);

    return Promise.resolve(team);
  }

  findById(id: number): Promise<Team | null> {
    const team = this.items.find((item) => item.id === id);

    if (!team) {
      return null;
    }

    return Promise.resolve(team);
  }

  findByName(name: string): Promise<Team | null> {
    const team = this.items.find((item) => item.name === name);

    if (!team) {
      return null;
    }

    return Promise.resolve(team);
  }

  findAll(): Promise<Team[]> {
    return Promise.resolve(this.items.sort((a, b) => a.name.localeCompare(b.name)));
  }

  update(id: number, data: Prisma.TeamUpdateInput): Promise<Team> {
    const teamIndex = this.items.findIndex((item) => item.id === id);

    if (teamIndex === -1) {
      throw new Error('Team not found');
    }

    const team = this.items[teamIndex];

    this.items[teamIndex] = {
      ...team,
      name: typeof data.name === 'string' ? data.name : team.name,
      countryCode:
        data.countryCode === null
          ? null
          : typeof data.countryCode === 'string'
            ? data.countryCode
            : team.countryCode,
      flagUrl:
        data.flagUrl === null
          ? null
          : typeof data.flagUrl === 'string'
            ? data.flagUrl
            : team.flagUrl,
    };

    return Promise.resolve(this.items[teamIndex]);
  }

  delete(id: number): Promise<void> {
    const teamIndex = this.items.findIndex((item) => item.id === id);

    if (teamIndex === -1) {
      throw new Error('Team not found');
    }

    this.items.splice(teamIndex, 1);

    // Also remove any tournament associations
    this.tournamentTeams = this.tournamentTeams.filter((item) => item.teamId !== id);
    return Promise.resolve();
  }

  findByCountryCode(countryCode: string): Promise<Team[]> {
    return Promise.resolve(
      this.items
        .filter((item) => item.countryCode === countryCode)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  findByTournamentId(tournamentId: number): Promise<Team[]> {
    const teamIds = this.tournamentTeams
      .filter((item) => item.tournamentId === tournamentId)
      .map((item) => item.teamId);

    return Promise.resolve(
      this.items
        .filter((item) => teamIds.includes(item.id))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  // Helper method for testing to associate teams with tournaments
  associateTeamWithTournament(
    teamId: number,
    tournamentId: number,
    groupName?: string
  ): Promise<void> {
    this.tournamentTeams.push({
      teamId,
      tournamentId,
      groupName,
    });
    return Promise.resolve();
  }
}
