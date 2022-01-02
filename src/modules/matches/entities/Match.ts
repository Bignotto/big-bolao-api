import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Team } from './Team';

@Entity('matches')
class Match {
  @PrimaryColumn()
  id: number;

  @Column()
  description: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'country_code' })
  home_team: Team;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'country_code' })
  away_team: Team;

  @Column()
  match_location: string;

  @Column()
  match_stadium: string;

  @Column()
  match_date: Date;

  @Column()
  home_team_score: number;

  @Column()
  away_team_score: number;
}

export { Match };
