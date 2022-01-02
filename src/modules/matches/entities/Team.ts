import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('teams')
class Team {
  @PrimaryColumn()
  cuontry_code: string;

  @Column()
  name: string;

  @Column()
  foreign_name: string;

  @Column()
  country_flag: string;

  @Column()
  country_iso: string;

  @Column()
  champion: number;
}

export { Team };
