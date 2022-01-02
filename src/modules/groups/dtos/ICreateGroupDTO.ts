import { User } from '@modules/accounts/entities/User';

interface ICreateGroupDTO {
  id?: string;
  description: string;
  owner_id: string;
  password: string;
  users?: User[];
}

export { ICreateGroupDTO };
