import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interviewer_applications')
export class InterviewerApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ name: 'linkedin_url', length: 500 })
  linkedinUrl: string;

  @Column({ name: 'current_company', length: 255 })
  currentCompany: string;

  @Column({ name: 'previous_companies', type: 'text', default: '' })
  previousCompanies: string;

  @Column({ length: 40, default: 'UNDER_REVIEW' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
