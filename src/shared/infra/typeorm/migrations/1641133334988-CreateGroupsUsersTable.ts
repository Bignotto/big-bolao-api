import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGroupsUsersTable1641133334988 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'groups_users',
        columns: [
          {
            name: 'group_id',
            type: 'int',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'groups_users',
      new TableForeignKey({
        name: 'FK_GroupUser',
        referencedTableName: 'groups',
        referencedColumnNames: ['id'],
        columnNames: ['group_id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'groups_users',
      new TableForeignKey({
        name: 'FK_UserGroup',
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        columnNames: ['user_id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('groups_users', 'FK_GroupUser');
    await queryRunner.dropForeignKey('groups_users', 'FK_UserGroup');
    await queryRunner.dropTable('groups_users');
  }
}
