import { randomUUID } from 'node:crypto';
import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { ITournamentsRepository } from '../../repositories/tournaments/ITournamentsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';

interface ICreatePoolRequest {
  name: string;
  description?: string;
  tournamentId: number;
  creatorId: string;
  isPrivate?: boolean;
  maxParticipants?: number;
  registrationDeadline?: Date;
}

export class CreatePoolUseCase {
  constructor(
    private poolsRepository: IPoolsRepository,
    private usersRepository: IUsersRepository,
    private tournamentsRepository: ITournamentsRepository
  ) {}

  async execute({
    name,
    description,
    tournamentId,
    creatorId,
    isPrivate = false,
    maxParticipants,
    registrationDeadline,
  }: ICreatePoolRequest) {
    // Verify if creator exists
    const creator = await this.usersRepository.findById(creatorId);

    if (!creator) {
      throw new ResourceNotFoundError('User not found');
    }

    // Verify if tournament exists
    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    // Generate invite code for private pools
    const inviteCode = isPrivate ? randomUUID() : null;

    // Create the pool
    const pool = await this.poolsRepository.create({
      name,
      description,
      tournament: {
        connect: { id: tournamentId },
      },
      creator: {
        connect: { id: creatorId },
      },
      isPrivate,
      inviteCode,
      maxParticipants,
      registrationDeadline,
    });

    // Create default scoring rules
    await this.poolsRepository.createScoringRules({
      pool: { connect: { id: pool.id } },
      exactScorePoints: 3,
      correctWinnerGoalDiffPoints: 2,
      correctWinnerPoints: 1,
      correctDrawPoints: 1,
      specialEventPoints: 5,
      knockoutMultiplier: 1.5,
      finalMultiplier: 2.0,
    });

    // Add creator as a participant
    await this.poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creatorId,
    });

    return pool;
  }
}
