import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamsTable1641119077677 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE TABLE teams (
      id SERIAL UNIQUE PRIMARY KEY,
      name varchar(20),
      foreign_name varchar(20),
      country_code varchar(6),
      country_flag varchar(75),
      country_iso varchar(3),
      champion int
     );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teams');
  }
}
