import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Submit a candidate job application and persist to DB & Google Sheet' })
  async applyForJob(@Body() dto: CreateJobApplicationDto) {
    const application = await this.jobsService.applyForJob(dto);
    return {
      success: true,
      message: 'Application submitted successfully',
      application,
    };
  }

  @Get('applications')
  @ApiOperation({ summary: 'Retrieve all submitted candidate job applications' })
  async getAllApplications() {
    return this.jobsService.getAllApplications();
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Retrieve specific job application details' })
  async getApplicationById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.jobsService.getApplicationById(id);
  }

  @Get('instahyre/live')
  @ApiOperation({ summary: 'Retrieve top live jobs directly from Instahyre' })
  async getLiveInstahyreJobs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('skills') skills?: string,
  ) {
    try {
      const take = limit ? Math.min(25, Math.max(1, Number(limit))) : 10;
      const skip = offset ? Math.max(0, Number(offset)) : 0;
      const res = await fetch(
        `https://www.instahyre.com/api/v1/job_search?offset=${skip}&count=${take}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        },
      );

      if (!res.ok) return [];

      const data = (await res.json()) as any;
      let items = (data?.objects || []);

      // If skills provided, prioritize matches
      if (skills && typeof skills === 'string') {
        const queryTokens = skills.toLowerCase().split(/[,\s]+/).filter(Boolean);
        if (queryTokens.length > 0) {
          items.sort((a: any, b: any) => {
            const aKeywords = (a.keywords || []).map((k: string) => k.toLowerCase()).join(' ');
            const bKeywords = (b.keywords || []).map((k: string) => k.toLowerCase()).join(' ');
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();

            const aScore = queryTokens.reduce((acc, t) => acc + (aKeywords.includes(t) || aTitle.includes(t) ? 1 : 0), 0);
            const bScore = queryTokens.reduce((acc, t) => acc + (bKeywords.includes(t) || bTitle.includes(t) ? 1 : 0), 0);
            return bScore - aScore;
          });
        }
      }

      return items.slice(0, take).map((j: any) => {
        const compSlug = (j.employer?.company_name || '')
          .toLowerCase()
          .replace(/[\.\,\(\)\']/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '')
          .replace(/^-+|-+$/g, '');

        return {
          id: j.id,
          title: j.title || j.candidate_title || 'Software Engineer',
          companyName: j.employer?.company_name || 'Tech Company',
          companyLogo: j.employer?.profile_image_src || '',
          companyTagline: j.employer?.company_tagline || '',
          companyLinkedInUrl: `https://www.linkedin.com/company/${compSlug}`,
          location: Array.isArray(j.locations) ? j.locations.join(', ') : (j.locations || 'Remote'),
          skills: Array.isArray(j.keywords) ? j.keywords : [],
          publicUrl: j.public_url || `https://www.instahyre.com/job-${j.id}`,
        };
      });
    } catch (err) {
      return [];
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve job processing status and current stage' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJob(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<JobResponseDto> {
    return this.jobsService.findById(id);
  }
}

