import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCandidateDto {
  @ApiProperty({
    description: 'LinkedIn public profile URL (e.g. https://www.linkedin.com/in/username)',
    example: 'https://www.linkedin.com/in/alex-chen-senior-fullstack',
  })
  @IsString()
  @IsNotEmpty({ message: 'LinkedIn profile URL is required' })
  @MaxLength(500, { message: 'Profile URL is too long (maximum 500 characters)' })
  profileUrl: string;

  @ApiPropertyOptional({
    description: 'Candidate display name override (e.g. Dhruva H)',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Candidate headline / current title (e.g. Software Engineer @ ...)',
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: 'Direct profile text, about section, resume or work experience to parse with AI',
  })
  @IsOptional()
  @IsString()
  profileText?: string;

  @ApiPropertyOptional({
    description: 'People Data Labs API Key for live candidate enrichment',
  })
  @IsOptional()
  @IsString()
  pdlApiKey?: string;
}
