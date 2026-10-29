import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobApplicationDto {
  @ApiProperty({ description: 'Job Identifier' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Title of the Job Opening' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ description: 'Company hiring for the role' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Candidate Full Name' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Candidate Email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Candidate Phone Number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Candidate LinkedIn Profile URL' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'Current Salary / CTC' })
  @IsOptional()
  @IsString()
  currentSalary?: string;

  @ApiPropertyOptional({ description: 'Expected Salary / CTC' })
  @IsOptional()
  @IsString()
  expectedSalary?: string;

  @ApiPropertyOptional({ description: 'Candidate Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Original Resume File Name' })
  @IsOptional()
  @IsString()
  resumeFileName?: string;

  @ApiPropertyOptional({ description: 'Resume File Base64 Data or Data URL' })
  @IsOptional()
  @IsString()
  resumeData?: string;
}

