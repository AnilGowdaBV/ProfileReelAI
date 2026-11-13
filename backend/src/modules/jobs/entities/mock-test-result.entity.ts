import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mock_test_results')
export class MockTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'linkedin_url', length: 500, default: '' })
  linkedinUrl: string;

  @Column({ name: 'test_id', length: 40 })
  testId: string;

  @Column({ name: 'question_no', type: 'int' })
  questionNo: number;

  @Column({ name: 'question_id', length: 80 })
  questionId: string;

  @Column({ length: 40 })
  difficulty: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 120, default: '' })
  pattern: string;

  @Column({ name: 'leetcode_url', length: 500, default: '' })
  leetcodeUrl: string;

  @Column({ name: 'submission_url', length: 500, default: '' })
  submissionUrl: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', default: '' })
  code: string;

  @Column({ name: 'case_note', type: 'text', default: '' })
  caseNote: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
