import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum JobStage {
  SUBMITTED = 'SUBMITTED',
  URL_VALIDATION = 'URL_VALIDATION',
  PROFILE_RETRIEVAL = 'PROFILE_RETRIEVAL',
  FACT_NORMALIZATION = 'FACT_NORMALIZATION',
  READY_FOR_SCRIPT = 'READY_FOR_SCRIPT',
  SCRIPT_GENERATION = 'SCRIPT_GENERATION',
  AUDIO_GENERATION = 'AUDIO_GENERATION',
  VIDEO_COMPOSITION = 'VIDEO_COMPOSITION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('generation_jobs')
export class GenerationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_generation_jobs_candidate_id')
  @Column()
  candidateId: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({
    type: 'varchar',
    length: 100,
    default: JobStage.SUBMITTED,
  })
  currentStage: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
