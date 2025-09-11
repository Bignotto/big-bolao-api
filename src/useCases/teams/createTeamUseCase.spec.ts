import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryTeamsRepository } from '@/repositories/teams/InMemoryTeamsRepository';

import { CreateTeamUseCase } from './createTeamUseCase';

let teamsRepository: InMemoryTeamsRepository;
let sut: CreateTeamUseCase;

describe('Create Team Use Case', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    sut = new CreateTeamUseCase(teamsRepository);
  });

  it('should be able to create a new team', async () => {
    const team = await sut.execute({
      name: 'Brazil',
      countryCode: 'BRA',
      flagUrl: 'https://example.com/brazil-flag.png',
    });

    expect(team.id).toEqual(1);
    expect(team.name).toEqual('Brazil');
    expect(team.countryCode).toEqual('BRA');
    expect(team.flagUrl).toEqual('https://example.com/brazil-flag.png');
  });

  it('should not be able to create a team with an existing name', async () => {
    await sut.execute({
      name: 'Brazil',
      countryCode: 'BRA',
    });

    await expect(() =>
      sut.execute({
        name: 'Brazil',
        countryCode: 'BRA',
      })
    ).rejects.toThrow('Team with this name already exists');
  });

  it('should be able to create a team without countryCode and flagUrl', async () => {
    const team = await sut.execute({
      name: 'Test Team',
    });

    expect(team.id).toEqual(1);
    expect(team.name).toEqual('Test Team');
    expect(team.countryCode).toBeNull();
    expect(team.flagUrl).toBeNull();
  });
});
