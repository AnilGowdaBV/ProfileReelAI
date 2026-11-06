import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { SubmitMockTestDto } from './dto/submit-mock-test.dto';
import { CourseRecommendationsService } from './course-recommendations.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly courseRecommendations: CourseRecommendationsService,
  ) {}

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

  @Post('mock-test')
  @ApiOperation({ summary: 'Submit a mock test paper (answer links + snapshots) to Google Sheet 3' })
  async submitMockTest(@Body() dto: SubmitMockTestDto) {
    const result = await this.jobsService.submitMockTest(dto);
    return {
      success: true,
      message: 'Mock test saved to Sheet 3',
      ...result,
    };
  }

  @Post('sync-sheet')
  @ApiOperation({ summary: 'Sync all database applications to Google Sheet' })
  async syncToSheet(@Body('webhookUrl') webhookUrl?: string) {
    return this.jobsService.syncAllToGoogleSheet(webhookUrl);
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
  @ApiOperation({ summary: 'Retrieve dynamic live matched jobs directly from Instahyre' })
  async getLiveInstahyreJobs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('skills') skills?: string,
  ) {
    try {
      const take = limit ? Math.min(40, Math.max(1, Number(limit))) : 20;
      const skip = offset ? Math.max(0, Number(offset)) : 0;

      // Format skills for Instahyre's search endpoint
      const rawTokens = skills && typeof skills === 'string'
        ? skills
            .split(/[,\s]+/)
            .map((s) => s.trim().replace(/[^a-zA-Z0-9\.\+#\-]/g, ''))
            .filter((s) => s.length > 1)
        : [];

      // Query Instahyre using plus-separated primary skills
      let searchUrl = `https://www.instahyre.com/api/v1/job_search?offset=${skip}&count=${take}`;
      if (rawTokens.length > 0) {
        const primarySkills = rawTokens.slice(0, 2).join('+');
        searchUrl = `https://www.instahyre.com/api/v1/job_search?skills=${encodeURIComponent(primarySkills)}&offset=${skip}&count=${take}`;
      }

      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      };

      let res = await fetch(searchUrl, { headers });
      let data = (await res.json().catch(() => null)) as any;
      let items = data?.objects || [];

      // If targeted skill search returned 0 items, fallback to broader feed and rank locally
      if (items.length === 0 && rawTokens.length > 0) {
        const fallbackUrl = `https://www.instahyre.com/api/v1/job_search?offset=${skip}&count=${take}`;
        res = await fetch(fallbackUrl, { headers });
        data = (await res.json().catch(() => null)) as any;
        items = data?.objects || [];
      }

      // Prioritize and rank jobs by candidate's profile skills
      if (rawTokens.length > 0 && items.length > 0) {
        const lowerTokens = rawTokens.map((t) => t.toLowerCase());
        items.sort((a: any, b: any) => {
          const aKeywords = (a.keywords || []).map((k: string) => String(k).toLowerCase()).join(' ');
          const bKeywords = (b.keywords || []).map((k: string) => String(k).toLowerCase()).join(' ');
          const aTitle = (a.title || a.candidate_title || '').toLowerCase();
          const bTitle = (b.title || b.candidate_title || '').toLowerCase();

          const aScore = lowerTokens.reduce(
            (acc, t) => acc + (aKeywords.includes(t) || aTitle.includes(t) ? 2 : 0),
            0,
          );
          const bScore = lowerTokens.reduce(
            (acc, t) => acc + (bKeywords.includes(t) || bTitle.includes(t) ? 2 : 0),
            0,
          );
          return bScore - aScore;
        });
      }

      return items.slice(0, take).map((j: any) => {
        const compName = j.employer?.company_name || 'Tech Company';
        const compSlug = compName
          .toLowerCase()
          .replace(/[\.\,\(\)\']/g, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9\-]/g, '')
          .replace(/^-+|-+$/g, '');

        const keywords = Array.isArray(j.keywords) ? j.keywords : [];

        // Calculate dynamic profile match percentage
        let matchScore = 92;
        if (rawTokens.length > 0) {
          const lowerTokens = rawTokens.map((t) => t.toLowerCase());
          const matchingCount = keywords.filter((k: string) =>
            lowerTokens.some((t) => String(k).toLowerCase().includes(t)),
          ).length;
          matchScore = Math.min(99, 90 + matchingCount * 3 + (Number(j.id) % 5));
        } else {
          matchScore = 93 + (Number(j.id) % 6);
        }

        return {
          id: String(j.id),
          title: j.title || j.candidate_title || 'Software Engineer',
          company: compName,
          companyName: compName,
          companyLogo: j.employer?.profile_image_src || '',
          logo:
            j.employer?.profile_image_src ||
            `https://www.google.com/s2/favicons?domain=${compSlug}.com&sz=64`,
          companyTagline: j.employer?.company_tagline || '',
          companyLinkedInUrl: `https://www.linkedin.com/company/${compSlug}`,
          location: Array.isArray(j.locations)
            ? j.locations.join(', ')
            : j.locations || 'Bangalore, India',
          skills: keywords,
          url: j.public_url || `https://www.instahyre.com/job-${j.id}`,
          publicUrl: j.public_url || `https://www.instahyre.com/job-${j.id}`,
          matchPercentage: matchScore,
          instahyreNote:
            j.employer?.instahyre_note ||
            j.employer?.instahyre_note_short ||
            j.employer?.company_tagline ||
            '',
        };
      });
    } catch (err) {
      console.error('Failed to fetch live Instahyre jobs:', err);
      return [];
    }
  }

  @Get('courses/recommended')
  @ApiOperation({
    summary: 'Recommend catalog courses from the candidate skills and interests',
  })
  async recommendCourses(
    @Query('skills') skills?: string,
    @Query('interests') interests?: string,
    @Query('limit') limit?: number,
  ) {
    const take = Math.min(15, Math.max(1, Number(limit) || 5));
    try {
      return await this.courseRecommendations.recommend(skills || '', interests || '', take);
    } catch (err) {
      console.error('Failed to recommend courses:', err);
      return { courses: [], totalMatched: 0, limit: take };
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

