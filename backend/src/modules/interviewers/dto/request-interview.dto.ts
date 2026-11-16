import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestInterviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  candidateName: string;

  @ApiProperty()
  @IsEmail()
  candidateEmail: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  jobTitle: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
