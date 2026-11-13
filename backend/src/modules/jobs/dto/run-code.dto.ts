import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunCodeDto {
  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30000)
  source: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30000)
  testsJson: string;
}
