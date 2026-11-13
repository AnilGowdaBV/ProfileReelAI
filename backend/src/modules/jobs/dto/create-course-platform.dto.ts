import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCoursePlatformDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ description: 'What this platform is meant for, e.g. DSA or LLD' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  purpose?: string;
}
