interface ICreateGuessDTO {
  id?: number;
  match_id: number;
  user_id: string;
  group_id: string;
  home_team: number;
  away_team: number;
}

export { ICreateGuessDTO };
