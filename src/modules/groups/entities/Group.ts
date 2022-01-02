import { User } from '@modules/accounts/entities/User';
import { Match } from '@modules/matches/entities/Match';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('groups')
class Group {
  @PrimaryColumn()
  id: number;

  @Column()
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id' })
  owner_id: User;

  @Column()
  password: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'groups_users',
    joinColumns: [{ name: 'group_id' }],
    inverseJoinColumns: [{ name: 'user_id' }],
  })
  users: User[];
}
