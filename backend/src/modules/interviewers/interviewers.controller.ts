import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { AdminService } from '../admin/admin.service';
import { ApplyInterviewerDto } from './dto/apply-interviewer.dto';
import { InterviewersService } from './interviewers.service';

class StatusDto {
  @IsString()
  @IsIn(['UNDER_REVIEW', 'APPROVED', 'REJECTED'])
  status: string;
}

@ApiTags('Interviewers')
@Controller('interviewers')
export class InterviewersController {
  constructor(
    private readonly interviewers: InterviewersService,
    private readonly admin: AdminService,
  ) {}

  @Post('apply')
  @ApiOperation({ summary: 'Submit a Be an interviewer application' })
  apply(@Body() dto: ApplyInterviewerDto) {
    return this.interviewers.apply(dto);
  }

  @Get('mine')
  mine(@Query('email') email?: string) {
    return this.interviewers.statusFor(email || '');
  }

  @Get('applications')
  list(@Headers('authorization') authorization?: string) {
    this.admin.session(authorization);
    return this.interviewers.list();
  }

  @Patch('applications/:id')
  update(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() dto: StatusDto,
  ) {
    this.admin.session(authorization);
    return this.interviewers.setStatus(id, dto.status);
  }
}
