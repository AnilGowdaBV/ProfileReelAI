import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '../entities/generation-job.entity';

export class JobResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  candidateId: string;

  @ApiProperty({ enum: JobStatus, example: JobStatus.COMPLETED })
  status: JobStatus;

  @ApiProperty({ example: 'FACT_NORMALIZATION' })
  currentStage: string;

  @ApiPropertyOptional({ example: 'PROFILE_DATA_UNAVAILABLE' })
  errorCode?: string;

  @ApiPropertyOptional({
    example: 'No authorized profile data could be retrieved for this URL',
  })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
