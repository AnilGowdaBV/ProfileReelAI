import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Candidate } from './candidate.entity';

export enum FactCategory {
  HEADLINE = 'headline',
  SUMMARY = 'summary',
  EXPERIENCE = 'experience',
  SKILLS = 'skills',
  EDUCATION = 'education',
  CERTIFICATION = 'certification',
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  UNVERIFIED = 'UNVERIFIED',
  INSUFFICIENT = 'INSUFFICIENT',
}

@Entity('candidate_facts')
export class CandidateFact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_candidate_facts_candidate_id')
  @Column({ type: 'varchar', length: 36 })
  candidateId: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.facts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({
    type: 'enum',
    enum: FactCategory,
  })
  category: FactCategory;

  @Column({ type: 'text' })
  factText: string;

  @Column({ type: 'varchar', length: 100, default: 'AUTHORIZED_PROFILE_DATA' })
  sourceType: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.VERIFIED,
  })
  verificationStatus: VerificationStatus;

  @CreateDateColumn()
  createdAt: Date;
}
