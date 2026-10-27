import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialMigration1729900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users Table
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: true,
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

    // 2. Candidates Table
    await queryRunner.createTable(
      new Table({
        name: 'candidates',
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
            name: 'submittedProfileUrl',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'normalizedProfileUrl',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'retrievalStatus',
            type: 'enum',
            enum: ['PENDING', 'SUCCESS', 'PROFILE_DATA_UNAVAILABLE', 'FAILED'],
            default: "'PENDING'",
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

    await queryRunner.createIndex(
      'candidates',
      new TableIndex({
        name: 'idx_candidates_normalized_url',
        columnNames: ['normalizedProfileUrl'],
      }),
    );

    // 3. Candidate Facts Table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_facts',
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
            name: 'category',
            type: 'enum',
            enum: ['headline', 'summary', 'experience', 'skills', 'education', 'certification'],
            isNullable: false,
          },
          {
            name: 'factText',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'sourceType',
            type: 'varchar',
            length: '100',
            default: "'AUTHORIZED_PROFILE_DATA'",
          },
          {
            name: 'verificationStatus',
            type: 'enum',
            enum: ['VERIFIED', 'UNVERIFIED', 'INSUFFICIENT'],
            default: "'VERIFIED'",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'candidate_facts',
      new TableIndex({
        name: 'idx_candidate_facts_candidate_id',
        columnNames: ['candidateId'],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_facts',
      new TableForeignKey({
        columnNames: ['candidateId'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 4. Generation Jobs Table
    await queryRunner.createTable(
      new Table({
        name: 'generation_jobs',
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
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            default: "'PENDING'",
          },
          {
            name: 'currentStage',
            type: 'varchar',
            length: '100',
            default: "'SUBMITTED'",
          },
          {
            name: 'errorCode',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
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

    await queryRunner.createIndex(
      'generation_jobs',
      new TableIndex({
        name: 'idx_generation_jobs_candidate_id',
        columnNames: ['candidateId'],
      }),
    );

    await queryRunner.createForeignKey(
      'generation_jobs',
      new TableForeignKey({
        columnNames: ['candidateId'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // 5. Generated Videos Table
    await queryRunner.createTable(
      new Table({
        name: 'generated_videos',
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
            name: 'generationJobId',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'script',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'videoStoragePath',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'durationSeconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'],
            default: "'PENDING'",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'generated_videos',
      new TableIndex({
        name: 'idx_generated_videos_candidate_id',
        columnNames: ['candidateId'],
      }),
    );

    await queryRunner.createForeignKey(
      'generated_videos',
      new TableForeignKey({
        columnNames: ['candidateId'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('generated_videos');
    await queryRunner.dropTable('generation_jobs');
    await queryRunner.dropTable('candidate_facts');
    await queryRunner.dropTable('candidates');
    await queryRunner.dropTable('users');
  }
}
