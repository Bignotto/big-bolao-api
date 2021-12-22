interface ICreateUserDTO {
  id?: string;
  name: string;
  password: string;
  email: string;
  favTeam?: string;
  avatar?: string;
  profile?: string;
}

export { ICreateUserDTO };
