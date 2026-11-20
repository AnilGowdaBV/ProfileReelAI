import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash?: string;

  @Column({ name: 'plugin_password_hash', type: 'varchar', length: 255, nullable: true })
  pluginPasswordHash?: string;

  @Column({ name: 'reset_token', type: 'varchar', length: 64, nullable: true })
  resetToken?: string;

  @Column({ name: 'reset_expires', type: 'timestamp', nullable: true })
  resetExpires?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedinId?: string;

  @Column({ name: 'linkedin_profile', type: 'varchar', length: 500, default: '' })
  linkedinProfile: string;

  @Column({ name: 'job_track', type: 'varchar', length: 20, default: '' })
  jobTrack: string;

  @Column({ name: 'job_skill', type: 'varchar', length: 40, default: '' })
  jobSkill: string;

  @Column({ name: 'resume_url', type: 'text', nullable: true })
  resumeUrl?: string;

  @Column({ name: 'resume_file_name', type: 'varchar', length: 255, default: '' })
  resumeFileName: string;

  @Column({ name: 'profile_ready', type: 'boolean', default: false })
  profileReady: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  headline?: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', default: false })
  isPro: boolean;

  @Column({ type: 'timestamp', nullable: true })
  proExpiresAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastPaymentId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
