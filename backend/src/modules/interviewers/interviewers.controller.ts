import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { AdminService } from '../admin/admin.service';
import { AddInterviewerDto } from './dto/add-interviewer.dto';
import { ApplyInterviewerDto } from './dto/apply-interviewer.dto';
import { RequestInterviewDto } from './dto/request-interview.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { GoogleMeetService } from './google-meet.service';
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
    private readonly googleMeet: GoogleMeetService,
  ) {}

  @Get('google/connect')
  @ApiOperation({ summary: 'Connect the company Google account that owns every Meet' })
  connectGoogle(@Res() response: Response) {
    response.redirect(this.googleMeet.connectUrl());
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Save the company Google account after consent' })
  async googleCallback(@Query('code') code: string | undefined, @Res() response: Response) {
    if (!code) {
      response.status(400).send('Google did not return a code.');
      return;
    }
    const email = await this.googleMeet.saveAuthorization(code);
    response.type('html').send(`<p>Connected ${email}. New interviews will get a Meet link from this account.</p>`);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Submit a Be an interviewer application' })
  apply(@Body() dto: ApplyInterviewerDto) {
    return this.interviewers.apply(dto);
  }

  @Get('picks')
  @ApiOperation({ summary: 'Approved interviewer profiles a candidate can request' })
  picks() {
    return this.interviewers.publicPicks();
  }

  @Post('requests')
  @ApiOperation({ summary: 'Candidate asks an interviewer to take their interview' })
  requestInterview(@Body() dto: RequestInterviewDto) {
    return this.interviewers.requestInterview(dto);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Candidate or interviewer reschedules a meeting' })
  reschedule(@Param('id') id: string, @Query('email') email: string | undefined, @Body() body: ScheduleInterviewDto) {
    return this.interviewers.reschedule(id, email || '', body);
  }

  @Get('mine-requests')
  @ApiOperation({ summary: 'Interview requests sent by this candidate' })
  mineRequests(@Query('email') email?: string) {
    return this.interviewers.candidateInbox(email || '');
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Interview requests for the approved interviewer who is logged in' })
  inbox(@Query('email') email?: string) {
    return this.interviewers.inboxFor(email || '');
  }

  @Get('inbox/:id/profile')
  @ApiOperation({ summary: 'Candidate application and resume for an interview request' })
  profile(@Param('id') id: string, @Query('email') email?: string) {
    return this.interviewers.candidateProfile(id, email || '');
  }

  @Patch('inbox/:id')
  @ApiOperation({ summary: 'Approved interviewer accepts a request' })
  accept(@Param('id') id: string, @Query('email') email?: string) {
    return this.interviewers.acceptRequest(id, email || '');
  }

  @Patch('inbox/:id/reject')
  @ApiOperation({ summary: 'Approved interviewer rejects a request' })
  reject(@Param('id') id: string, @Query('email') email?: string) {
    return this.interviewers.rejectRequest(id, email || '');
  }

  @Get('photo')
  photo(@Query('email') email?: string) {
    return this.interviewers.candidatePhoto(email || '');
  }

  @Get('mine')
  mine(@Query('email') email?: string) {
    return this.interviewers.statusFor(email || '');
  }

  @Post('applications')
  @ApiOperation({ summary: 'Admin adds an interviewer who can log in immediately' })
  add(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: AddInterviewerDto,
  ) {
    this.admin.session(authorization);
    return this.interviewers.addApproved(dto);
  }

  @Get('recordings')
  @ApiOperation({ summary: 'Admin list of interview recordings from the company Meet account' })
  recordings(@Headers('authorization') authorization?: string) {
    this.admin.session(authorization);
    return this.interviewers.recordings();
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
