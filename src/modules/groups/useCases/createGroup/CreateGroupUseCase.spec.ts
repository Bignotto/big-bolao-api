import { User } from '@modules/accounts/entities/User';
import { UserInMemoryRepository } from '@modules/accounts/repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from '@modules/accounts/useCases/createUser/CreateUserUseCase';
import { GroupInMemoryRepository } from '@modules/groups/repositories/inMemory/GroupInMemoryRepository';
import { CreateGroupUseCase } from './CreateGroupUseCase';

let createGroupUseCase: CreateGroupUseCase;
let groupRepository: GroupInMemoryRepository;

let createUserUseCase: CreateUserUseCase;
let userRepository: UserInMemoryRepository;

describe('Create Group Use Case', () => {
  beforeEach(() => {
    groupRepository = new GroupInMemoryRepository();
    createGroupUseCase = new CreateGroupUseCase(groupRepository);

    userRepository = new UserInMemoryRepository();
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it('should be able to create a new group', async () => {
    const user = new User();
    Object.assign(user, {
      name: 'Test Dude',
      email: 'dude@test.com',
      password: '123456',
    });

    const createdGroup = await createGroupUseCase.execute({
      description: 'Test Group',
      owner_id: user.id,
      password: '123',
      users: [user],
    });

    console.log(createdGroup);
    expect(createdGroup).toHaveProperty('id');
  });
});
