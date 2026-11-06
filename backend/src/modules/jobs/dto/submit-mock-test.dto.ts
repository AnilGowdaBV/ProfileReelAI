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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  leetcodeUrl: string;

  @ApiProperty({ description: 'LeetCode submitted-answer / submissions URL' })
  @IsString()
  @IsNotEmpty()
  submissionUrl: string;

  @ApiPropertyOptional({ description: 'JPEG/PNG snapshot as a data URL' })
  @IsOptional()
  @IsString()
  snapshotData?: string;
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

  @ApiProperty({ type: [MockTestAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => MockTestAnswerDto)
  answers: MockTestAnswerDto[];
}
