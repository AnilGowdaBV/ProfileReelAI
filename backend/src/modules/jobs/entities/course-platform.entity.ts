import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('course_platforms')
export class CoursePlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ length: 255, default: '' })
  purpose: string;

  @Column({ name: 'recommend_for', length: 80, default: '' })
  recommendFor: string;

  @Column({ length: 40, default: 'APPROVED' })
  status: string;

  @Column({ name: 'submitted_by', length: 255, default: '' })
  submittedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
