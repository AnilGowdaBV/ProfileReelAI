import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CandidateFact } from './candidate-fact.entity';
import { GenerationJob } from '../../jobs/entities/generation-job.entity';
import { GeneratedVideo } from '../../video-generation/entities/generated-video.entity';

export enum RetrievalStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  PROFILE_DATA_UNAVAILABLE = 'PROFILE_DATA_UNAVAILABLE',
  FAILED = 'FAILED',
}

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  submittedProfileUrl: string;

  @Index('idx_candidates_normalized_url')
  @Column({ type: 'varchar', length: 500 })
  normalizedProfileUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  profilePictureUrl?: string;

  @Column({
    type: 'enum',
    enum: RetrievalStatus,
    default: RetrievalStatus.PENDING,
  })
  retrievalStatus: RetrievalStatus;

  @OneToMany(() => CandidateFact, (fact) => fact.candidate)
  facts: CandidateFact[];

  @OneToMany(() => GenerationJob, (job) => job.candidate)
  jobs: GenerationJob[];

  @OneToMany(() => GeneratedVideo, (video) => video.candidate)
  videos: GeneratedVideo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
