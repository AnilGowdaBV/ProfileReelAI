import { IsOptional, IsString } from 'class-validator';

export class ScheduleInterviewDto {
  @IsString()
  date: string;

  @IsString()
  time: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  meetLink?: string;
}
