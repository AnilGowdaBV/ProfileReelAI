import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('interview_requests')
export class InterviewRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'interviewer_id', length: 36 })
  interviewerId: string;

  @Column({ name: 'candidate_name', length: 255 })
  candidateName: string;

  @Column({ name: 'candidate_email', length: 255 })
  candidateEmail: string;

  @Column({ name: 'job_title', length: 255 })
  jobTitle: string;

  @Column({ name: 'company_name', length: 255 })
  companyName: string;

  @Column({ length: 20, default: 'REQUESTED' })
  status: string;

  @Column({ name: 'interview_date', length: 20, default: '' })
  interviewDate: string;

  @Column({ name: 'interview_time', length: 20, default: '' })
  interviewTime: string;

  @Column({ type: 'text', default: '' })
  note: string;

  @Column({ name: 'meet_link', length: 1000, default: '' })
  meetLink: string;

  @Column({ name: 'meet_space', length: 200, default: '' })
  meetSpace: string;

  @Column({ name: 'notice', length: 40, default: '' })
  notice: string;

  @Column({ name: 'notice_for', length: 255, default: '' })
  noticeFor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
