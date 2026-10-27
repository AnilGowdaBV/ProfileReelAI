import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCandidateScoresToDecimal1729900000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE candidate_scores 
      MODIFY COLUMN overallScore DECIMAL(4,2) NOT NULL,
      MODIFY COLUMN experienceScore DECIMAL(4,2) NOT NULL,
      MODIFY COLUMN skillsScore DECIMAL(4,2) NOT NULL,
      MODIFY COLUMN educationScore DECIMAL(4,2) NOT NULL,
      MODIFY COLUMN impactScore DECIMAL(4,2) NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE candidate_scores 
      MODIFY COLUMN overallScore INT NOT NULL,
      MODIFY COLUMN experienceScore INT NOT NULL,
      MODIFY COLUMN skillsScore INT NOT NULL,
      MODIFY COLUMN educationScore INT NOT NULL,
      MODIFY COLUMN impactScore INT NOT NULL;
    `);
  }
}
