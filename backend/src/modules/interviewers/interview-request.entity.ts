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

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'meet_link', length: 1000, default: '' })
  meetLink: string;

  @Column({ name: 'meet_space', length: 200, default: '' })
  meetSpace: string;

  @Column({ name: 'notice', length: 40, default: '' })
  notice: string;

  @Column({ name: 'notice_for', length: 255, default: '' })
  noticeFor: string;

  @Column({ name: 'reminder_sent', type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'review_outcome', length: 10, default: '' })
  reviewOutcome: string;

  @Column({ name: 'review_rating', type: 'int', default: 0 })
  reviewRating: number;

  @Column({ name: 'review_feedback', type: 'text', nullable: true })
  reviewFeedback: string;

  @Column({ name: 'review_post', type: 'text', nullable: true })
  reviewPost: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
