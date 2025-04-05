import { Prisma, Team } from '@prisma/client';

export interface ITeamsRepository {
  create(data: Prisma.TeamCreateInput): Promise<Team>;
  findById(id: number): Promise<Team | null>;
  findByName(name: string): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  update(id: number, data: Prisma.TeamUpdateInput): Promise<Team>;
  delete(id: number): Promise<void>;
  findByCountryCode(countryCode: string): Promise<Team[]>;
  findByTournamentId(tournamentId: number): Promise<Team[]>;
}
