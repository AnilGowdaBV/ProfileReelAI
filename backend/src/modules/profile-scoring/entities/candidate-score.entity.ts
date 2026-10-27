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

export enum ScoreTier {
  EXCEPTIONAL = 'EXCEPTIONAL', // 9.0 - 10.0
  STRONG = 'STRONG',           // 7.5 - 8.9
  PROFICIENT = 'PROFICIENT',   // 6.0 - 7.4
  DEVELOPING = 'DEVELOPING',   // < 6.0
}

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string | number) => (v != null ? parseFloat(String(v)) : 0),
};

@Entity('candidate_scores')
export class CandidateScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_candidate_scores_candidate_id')
  @Column()
  candidateId: string;

  @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: decimalTransformer,
  })
  overallScore: number; // max 10.0

  @Column({
    type: 'enum',
    enum: ScoreTier,
    default: ScoreTier.PROFICIENT,
  })
  tier: ScoreTier;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: decimalTransformer,
  })
  experienceScore: number; // max 3.5

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: decimalTransformer,
  })
  skillsScore: number; // max 2.5

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: decimalTransformer,
  })
  educationScore: number; // max 2.0

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    transformer: decimalTransformer,
  })
  impactScore: number; // max 2.0 (LinkedIn Activeness & Professional Presence)

  @Column({ type: 'json' })
  keyStrengths: string[];

  @Column({ type: 'json' })
  growthAreas: string[];

  @Column({ type: 'json' })
  recommendedRoles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
