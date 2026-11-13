import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MockTestAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  difficulty: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leetcodeUrl?: string;

  @ApiPropertyOptional({ description: 'LeetCode submitted-answer / submissions URL' })
  @IsOptional()
  @IsString()
  submissionUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'JPEG/PNG snapshot as a data URL' })
  @IsOptional()
  @IsString()
  snapshotData?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseNote?: string;
}

export class SubmitMockTestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verdict?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verdictReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tabWarnings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pasteWarnings?: string;

  @ApiProperty({ type: [MockTestAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => MockTestAnswerDto)
  answers: MockTestAnswerDto[];
}
