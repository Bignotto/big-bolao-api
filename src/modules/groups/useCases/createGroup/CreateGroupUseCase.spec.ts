import { User } from '@modules/accounts/entities/User';
import { UserInMemoryRepository } from '@modules/accounts/repositories/inMemory/UserInMemoryRepository';
import { CreateUserUseCase } from '@modules/accounts/useCases/createUser/CreateUserUseCase';
import { GroupInMemoryRepository } from '@modules/groups/repositories/inMemory/GroupInMemoryRepository';
import { AppError } from '@shared/errors/AppError';
import { CreateGroupUseCase } from './CreateGroupUseCase';

let createGroupUseCase: CreateGroupUseCase;
let groupRepository: GroupInMemoryRepository;

let createUserUseCase: CreateUserUseCase;
let userRepository: UserInMemoryRepository;

describe('Create Group Use Case', () => {
  beforeEach(() => {
    groupRepository = new GroupInMemoryRepository();
    userRepository = new UserInMemoryRepository();

    createGroupUseCase = new CreateGroupUseCase(
      groupRepository,
      userRepository,
    );
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it('should be able to create a new group', async () => {
    const user = new User();
    Object.assign(user, {
      name: 'Test Dude',
      email: 'dude@test.com',
      password: '123456',
    });

    const createdUser = await createUserUseCase.execute(user);
    user.id = createdUser.id;

    const createdGroup = await createGroupUseCase.execute({
      description: 'Test Group',
      owner_id: createdUser.id,
      password: '123',
      users: [user],
    });

    expect(createdGroup).toHaveProperty('id');
  });

  it('should not be able to create a group when invalid user id is passed', async () => {
    await expect(() =>
      createGroupUseCase.execute({
        description: 'Test Group',
        owner_id: 'invalid id',
        password: '123',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it(`group owner should be in the group's users array`, async () => {
    const user = new User();
    Object.assign(user, {
      name: 'Test Dude',
      email: 'dude@test.com',
      password: '123456',
    });

    const createdUser = await createUserUseCase.execute(user);
    user.id = createdUser.id;

    const createdGroup = await createGroupUseCase.execute({
      description: 'Test Group',
      owner_id: createdUser.id,
      password: '123',
      users: [user],
    });

    expect(createdGroup.users.length).toBe(1);
    expect(createdGroup.owner_id).toEqual(createdGroup.users[0].id);
  });
});
