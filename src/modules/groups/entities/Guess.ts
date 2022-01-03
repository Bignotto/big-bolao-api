import { User } from '@modules/accounts/entities/User';
import { Match } from '@modules/matches/entities/Match';
import { Team } from '@modules/matches/entities/Team';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './Group';

@Entity('guesses')
class Guess {
  @PrimaryColumn()
  id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'id' })
  match_id: Match;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id' })
  user_id: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'id' })
  group_id: string;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'country_code' })
  home_team: number;

  @ManyToOne(() => Team)
  @JoinColumn({ name: 'country_code' })
  away_team: number;
}

export { Guess };
