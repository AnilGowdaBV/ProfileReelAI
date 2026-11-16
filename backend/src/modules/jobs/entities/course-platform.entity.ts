import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('course_platforms')
export class CoursePlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 255, default: '' })
  purpose: string;

  @Column({ name: 'recommend_for', length: 80, default: '' })
  recommendFor: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
