interface ICreateMatchDTO {
  id?: number;
  description: string;
  home_team: string;
  away_team: string;
  match_location: string;
  match_stadium: string;
  match_date: Date;
  home_team_score: number;
  away_team_score: number;
}

export { ICreateMatchDTO };
