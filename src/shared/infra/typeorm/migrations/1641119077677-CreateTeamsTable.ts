import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTeamsTable1641119077677 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'country_code',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'foreign_name',
            type: 'varchar',
          },
          {
            name: 'country_flag',
            type: 'varchar',
          },
          {
            name: 'country_iso',
            type: 'varchar',
          },
          {
            name: 'champion',
            type: 'int',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teams');
  }
}
