import { ResourceNotFoundError } from '../../global/errors/ResourceNotFoundError';
import { IPoolsRepository } from '../../repositories/pools/IPoolsRepository';
import { ITournamentsRepository } from '../../repositories/tournaments/ITournamentsRepository';
import { IUsersRepository } from '../../repositories/users/IUsersRepository';
import { PoolNameInUseError } from './errors/PoolNameInUseError';

interface ICreatePoolRequest {
  name: string;
  description?: string;
  tournamentId: number;
  creatorId: string;
  isPrivate?: boolean;
  maxParticipants?: number;
  registrationDeadline?: Date;
  inviteCode?: string;
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
    inviteCode,
  }: ICreatePoolRequest) {
    const creator = await this.usersRepository.findById(creatorId);

    if (!creator) {
      throw new ResourceNotFoundError('User not found');
    }

    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new ResourceNotFoundError('Tournament not found');
    }

    //const inviteCode = isPrivate ? randomUUID() : null;
    const nameFound = await this.poolsRepository.findByName(name);
    if (nameFound) {
      throw new PoolNameInUseError(`Pool name "${name}" is already in use.`);
    }

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

    await this.poolsRepository.addParticipant({
      poolId: pool.id,
      userId: creatorId,
    });

    return pool;
  }
}
