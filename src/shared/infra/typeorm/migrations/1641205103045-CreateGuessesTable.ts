import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGuessesTable1641205103045 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'guesses',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            generatedType: 'STORED',
          },
          {
            name: 'match_id',
            type: 'int',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'group_id',
            type: 'varchar',
          },
          {
            name: 'home_team',
            type: 'int',
          },
          {
            name: 'away_team',
            type: 'int',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_MatchId',
            referencedTableName: 'matches',
            referencedColumnNames: ['id'],
            columnNames: ['match_id'],
            onDelete: 'SET NULL',
          },
          {
            name: 'FK_UserId',
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            columnNames: ['user_id'],
            onDelete: 'SET NULL',
          },
          {
            name: 'FK_GroupId',
            referencedTableName: 'groups',
            referencedColumnNames: ['id'],
            columnNames: ['group_id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('guesses');
  }
}
