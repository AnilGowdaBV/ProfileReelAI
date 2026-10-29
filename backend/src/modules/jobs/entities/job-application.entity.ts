import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('job_applications')
export class JobApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', length: 100 })
  jobId: string;

  @Column({ name: 'job_title', length: 255 })
  jobTitle: string;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ name: 'email', length: 255 })
  email: string;

  @Column({ name: 'phone', length: 50 })
  phone: string;

  @Column({ name: 'linkedin_url', length: 500, nullable: true })
  linkedinUrl?: string;

  @Column({ name: 'current_salary', length: 100, nullable: true })
  currentSalary?: string;

  @Column({ name: 'expected_salary', length: 100, nullable: true })
  expectedSalary?: string;

  @Column({ name: 'location', length: 255, nullable: true })
  location?: string;

  @Column({ name: 'resume_file_name', length: 255, nullable: true })
  resumeFileName?: string;

  @Column({ name: 'resume_data', type: 'longtext', nullable: true })
  resumeData?: string;

  @Column({ name: 'status', length: 50, default: 'applied' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
