import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RetrievalStatus } from '../entities/candidate.entity';
import { FactCategory, VerificationStatus } from '../entities/candidate-fact.entity';

export class CandidateFactDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: FactCategory })
  category: FactCategory;

  @ApiProperty()
  factText: string;

  @ApiProperty()
  sourceType: string;

  @ApiProperty({ enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty()
  createdAt: Date;
}

export class CandidateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  submittedProfileUrl: string;

  @ApiProperty()
  normalizedProfileUrl: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiProperty({ enum: RetrievalStatus })
  retrievalStatus: RetrievalStatus;

  @ApiProperty({ type: [CandidateFactDto] })
  facts: CandidateFactDto[];

  @ApiPropertyOptional()
  latestJobId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateCandidateResponseDto {
  @ApiProperty()
  candidateId: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty({ enum: RetrievalStatus })
  retrievalStatus: RetrievalStatus;

  @ApiProperty()
  normalizedProfileUrl: string;

  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  errorReason?: string;
}
