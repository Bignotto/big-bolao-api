import { AppError } from '@shared/errors/AppError';

//this repository should be manualy implemented
import { __repo__(pascalCase)InMemoryRepository } from '../../repositories/inMemory/__repo__(pascalCase)InMemoryRepository';
import { __name__(pascalCase)UseCase } from './__name__(pascalCase)UseCase';

describe('Create User Use Case', () => {
  beforeEach(() => {
    __repo__(camelCase)InMemoryRepository = new __repo__(pascalCase)InMemoryRepository();
    __name__(camelCase)UseCase = new __name__(pascalCase)UseCase(__repo__(camelCase)InMemoryRepository);
  });

  it('should create a new user object', async () => {
    //action function should be manualy implemented
    const results = await __name__(camelCase)UseCase.action({});

    expect(2+2).toBe(4);
  });
}