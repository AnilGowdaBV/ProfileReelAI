import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddInterviewerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(80)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  linkedinUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  currentCompany: string;
}
