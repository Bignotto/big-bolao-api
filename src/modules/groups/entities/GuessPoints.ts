import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
  select
	  M0.id match_id,
	  M0.description,
    M0.match_date,
    T1.name home_team_name,
    M0.home_team_score,
    T2.name away_team_name,
    M0.away_team_score,
    G0.id guess_id,
    G0.group_id,
    G0.user_id,
    G0.home_team,
    G0.away_team,
	case
    	when M0.home_team_score = G0.home_team
        	AND M0.away_team_score = G0.away_team
            THEN 10
        else 0
    end as points
  from matches M0
    left join guesses G0 on G0.match_id = M0.id
      left join teams T1 on T1.country_code = M0.home_team
      left join teams T2 on T2.country_code = M0.away_team
  `,
})
class GuessPoints {
  @ViewColumn()
  match_id: number;

  @ViewColumn()
  description: string;

  @ViewColumn()
  date: Date;

  @ViewColumn()
  home_team_name: string;

  @ViewColumn()
  home_team_score: number;

  @ViewColumn()
  away_team_name: string;

  @ViewColumn()
  away_team_score: number;

  @ViewColumn()
  guess_id: number;

  @ViewColumn()
  group_id: string;

  @ViewColumn()
  user_id: string;

  @ViewColumn()
  home_team: number;

  @ViewColumn()
  away_team: number;

  @ViewColumn()
  points: number;
}

export { GuessPoints };
