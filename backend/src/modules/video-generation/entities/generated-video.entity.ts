import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum VideoStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

@Entity('generated_videos')
export class GeneratedVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_generated_videos_candidate_id')
  @Column({ type: 'varchar', length: 36 })
  candidateId: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.videos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({ type: 'varchar', length: 36, nullable: true })
  generationJobId?: string;

  @Column({ type: 'text', nullable: true })
  script?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoStoragePath?: string;

  @Column({ type: 'int', nullable: true })
  durationSeconds?: number;

  @Column({
    type: 'enum',
    enum: VideoStatus,
    default: VideoStatus.PENDING,
  })
  status: VideoStatus;

  @CreateDateColumn()
  createdAt: Date;
}
