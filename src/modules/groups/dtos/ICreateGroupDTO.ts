import { User } from '@modules/accounts/entities/User';

interface ICreateGroupDTO {
  id?: number;
  description: string;
  owner_id: User;
  password: string;
  users?: User[];
}

export { ICreateGroupDTO };
