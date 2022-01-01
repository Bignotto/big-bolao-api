import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('teams')
class Team {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  foreign_name: string;

  @Column()
  cuontry_code: string;

  @Column()
  country_flag: string;

  @Column()
  country_iso: string;

  @Column()
  champion: number;
}

export { Team };
