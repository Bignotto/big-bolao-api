import { inject, injectable } from 'tsyringe';

import { I__repo__(pascalCase)Repository } from '../../repositories/I__repo__(pascalCase)Repository';

import { __repo__(pascalCase) } from "@modules/__module__(lowerCase)/entities/__repo__(pascalCase)"

@injectable()
class __name__(pascalCase)UseCase {
  constructor(
    @inject('__repo__(pascalCase)Repository') private __repo__(camelCase)Repository: I__repo__(pascalCase)Repository,
  ) {}

  async execute(): Promise<__repo__(pascalCase)> {

    const result = await this.__repo__(camelCase)Repository.action();
    
    return result;
  }
}

export { __name__(pascalCase)UseCase };