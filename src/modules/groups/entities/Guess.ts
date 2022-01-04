import { User } from '@modules/accounts/entities/User';
import { Match } from '@modules/matches/entities/Match';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './Group';

@Entity('guesses')
class Guess {
  @PrimaryColumn()
  id: number;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'id' })
  match: Match;

  @Column()
  match_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'id' })
  group: Group;

  @Column()
  group_id: string;

  @Column()
  home_team: number;

  @Column()
  away_team: number;
}

export { Guess };
