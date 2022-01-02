import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMatchesTable1641126439473 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'matches',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'description',
            type: 'varchar',
          },
          {
            name: 'home_team',
            type: 'varchar',
          },
          {
            name: 'away_team',
            type: 'varchar',
          },
          {
            name: 'match_location',
            type: 'varchar',
          },
          {
            name: 'match_stadium',
            type: 'varchar',
          },
          {
            name: 'match_date',
            type: 'timestamp',
          },
          {
            name: 'home_team_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'away_team_score',
            type: 'int',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_HomeTeam',
            referencedTableName: 'teams',
            referencedColumnNames: ['country_code'],
            columnNames: ['home_team'],
            onDelete: 'SET NULL',
          },
          {
            name: 'FK_AwayTeam',
            referencedTableName: 'teams',
            referencedColumnNames: ['country_code'],
            columnNames: ['away_team'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('matches');
  }
}
