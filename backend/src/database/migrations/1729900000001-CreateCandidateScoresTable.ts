import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCandidateScoresTable1729900000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'candidate_scores',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'candidateId',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'overallScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'tier',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'experienceScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'skillsScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'educationScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'impactScore',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'keyStrengths',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'growthAreas',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'recommendedRoles',
            type: 'json',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign Key to candidates
    await queryRunner.createForeignKey(
      'candidate_scores',
      new TableForeignKey({
        name: 'fk_candidate_scores_candidate',
        columnNames: ['candidateId'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Index on candidateId for rapid lookups
    await queryRunner.createIndex(
      'candidate_scores',
      new TableIndex({
        name: 'idx_candidate_scores_candidate_id',
        columnNames: ['candidateId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('candidate_scores', true, true, true);
  }
}
