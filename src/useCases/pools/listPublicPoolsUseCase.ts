import { IPoolsRepository } from '@/repositories/pools/IPoolsRepository';

interface IListPublicPoolsRequest {
  page: number;
  perPage: number;
  name?: string;
}

export class ListPublicPoolsUseCase {
  constructor(private poolsRepository: IPoolsRepository) {}

  async execute({ page, perPage, name }: IListPublicPoolsRequest) {
    const pools = await this.poolsRepository.findPublicPools({
      page,
      perPage,
      name,
    });

    return { pools };
  }
}
