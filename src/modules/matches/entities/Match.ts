import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Team } from './Team';

@Entity('matches')
class Match {
  @PrimaryColumn()
  id: number;

  @Column()
  description: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'home_team' })
  home_team_obj: Team;

  @Column()
  home_team: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'away_team' })
  away_team_obj: Team;

  @Column()
  away_team: string;

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
