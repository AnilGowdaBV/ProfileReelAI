import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Controller, Get, Post, Patch, Delete, Body, Headers, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { AdminService } from '../admin/admin.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobResponseDto } from './dto/job-response.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { SubmitMockTestDto } from './dto/submit-mock-test.dto';
import { CodeRunnerService } from './code-runner.service';
import { CourseRecommendationsService } from './course-recommendations.service';
import { RunCodeDto } from './dto/run-code.dto';
import { CreateCoursePlatformDto } from './dto/create-course-platform.dto';

const FEATURED_JOB_TTL = 2 * 24 * 60 * 60 * 1000;
const featuredJobFile = join(process.cwd(), '.cache', 'featured-java-jobs.json');
let featuredJobCache: { at: number; jobs: any[] } | null = null;

function readFeaturedJobFile() {
  try {
    const saved = JSON.parse(readFileSync(featuredJobFile, 'utf8')) as { at: number; jobs: any[] };
    if (!saved?.at || !Array.isArray(saved.jobs) || saved.jobs.length === 0) return null;
    return saved;
  } catch {
    return null;
  }
}

const featuredRoleFallback = [
  ['target', 'Target in India', 'Java Developer', 'Bangalore', 'target.com'],
  ['omnissa', 'Omnissa', 'SMTS - Java', 'Bangalore', 'omnissa.com'],
  ['kla', 'KLA-Tencor', 'Java Developer', 'Chennai', 'kla.com'],
  ['innovaccer', 'Innovaccer', 'SSE - Java', 'Gurgaon', 'innovaccer.com'],
  ['meesho', 'Meesho', 'SDE - Java', 'Bangalore', 'meesho.com'],
  ['ey', 'EY', 'Java Developer', 'Bangalore', 'ey.com'],
  ['greyorange', 'GreyOrange', 'SDE III - Java', 'Gurgaon', 'greyorange.com'],
  ['arcticwolf', 'Arctic Wolf', 'Sr. Backend Engineer - Java', 'Bangalore', 'arcticwolf.com'],
].map(([id, company, title, location, domain]) => ({
  id,
  title,
  candidate_title: title,
  keywords: ['Java'],
  locations: [location],
  employer: {
    company_name: company,
    profile_image_src: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  },
}));

async function loadFeaturedJavaJobs(headers: Record<string, string>) {
  if (!featuredJobCache) featuredJobCache = readFeaturedJobFile();
  if (featuredJobCache && Date.now() - featuredJobCache.at < FEATURED_JOB_TTL) {
    return featuredJobCache.jobs;
  }
  const companyKey = (name: string) => {
    const bucket = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (bucket.startsWith('target')) return 'target';
    if (bucket.includes('omnissa') || bucket.includes('omnisa')) return 'omnissa';
    if (bucket.includes('kla')) return 'kla';
    if (bucket.includes('innovaccer') || bucket.includes('innovacer')) return 'innovaccer';
    if (bucket.includes('meesho')) return 'meesho';
    if (bucket === 'ey' || bucket.startsWith('eyg') || bucket.startsWith('eyi') || bucket.includes('ernstyoung')) return 'ey';
    if (bucket.includes('greyorange')) return 'greyorange';
    if (bucket.includes('arcticwolf')) return 'arcticwolf';
    return '';
  };
  let pages: any[][] = [];
  try {
    pages = await Promise.all(
      [0, 40, 80, 120, 160, 200, 240, 280].map(async (offset) => {
        const pageRes = await fetch(
          `https://www.instahyre.com/api/v1/job_search?skills=Java&offset=${offset}&count=40`,
          { headers },
        );
        if (!pageRes.ok) return [];
        const pageData = (await pageRes.json().catch(() => null)) as any;
        return pageData?.objects || [];
      }),
    );
  } catch {
    pages = [];
  }
  const seen = new Set<string>();
  const jobs: any[] = [];
  for (const batch of pages) {
    for (const job of batch) {
      const key = companyKey(job.employer?.company_name || '');
      const text = `${job.title || ''} ${job.candidate_title || ''} ${(job.keywords || []).join(' ')}`;
      const id = String(job.id || '');
      if (!key || !id || seen.has(id) || !/java|spring|j2ee|jvm|hibernate|microservices/i.test(text)) continue;
      seen.add(id);
      jobs.push(job);
    }
  }
  if (!jobs.length && featuredJobCache?.jobs?.length) return featuredJobCache.jobs;
  const ready = jobs.length ? jobs : featuredRoleFallback;
  featuredJobCache = { at: Date.now(), jobs: ready };
  try {
    mkdirSync(join(process.cwd(), '.cache'), { recursive: true });
    writeFileSync(featuredJobFile, JSON.stringify(featuredJobCache));
  } catch {
    // The in-memory copy still covers this process.
  }
  return ready;
}

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly courseRecommendations: CourseRecommendationsService,
    private readonly codeRunner: CodeRunnerService,
    private readonly admin: AdminService,
  ) {}

  @Post('run-code')
  @ApiOperation({ summary: 'Run a mock-test solution in the selected language' })
  async runCode(@Body() dto: RunCodeDto) {
    let tests: { args: unknown[]; output: unknown; hidden?: boolean }[] = [];
    try {
      tests = JSON.parse(dto.testsJson);
    } catch {
      tests = [];
    }
    return this.codeRunner.run(dto.language, dto.source, tests);
  }

  @Get('apply-allowance')
  async applyAllowance(@Query('email') email = '', @Query('linkedin') linkedin = '') {
    const needsPayment = await this.jobsService.jobApplyNeedsPayment(email, linkedin);
    return { needsPayment };
  }

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

  @Get('course-platforms')
  listCoursePlatforms() {
    return this.jobsService.listCoursePlatforms();
  }

  @Get('course-platforms/review')
  listCoursesForReview(@Headers('authorization') authorization: string | undefined) {
    this.admin.session(authorization);
    return this.jobsService.listCoursePlatformsForAdmin();
  }

  @Post('course-platforms/suggest')
  suggestCourse(@Body() dto: CreateCoursePlatformDto & { submittedBy?: string }) {
    return this.jobsService.suggestCoursePlatform(dto, dto.submittedBy || '');
  }

  @Patch('course-platforms/:id/review')
  reviewCourse(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status?: string },
  ) {
    this.admin.session(authorization);
    return this.jobsService.reviewCoursePlatform(id, body.status || '');
  }

  @Post('course-platforms')
  addCoursePlatform(@Headers('authorization') authorization: string | undefined, @Body() dto: CreateCoursePlatformDto) {
    this.admin.session(authorization);
    return this.jobsService.addCoursePlatform(dto);
  }

  @Patch('course-platforms/:id')
  updateCoursePlatform(
    @Headers('authorization') authorization: string | undefined,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCoursePlatformDto,
  ) {
    this.admin.session(authorization);
    return this.jobsService.updateCoursePlatform(id, dto);
  }

  @Delete('course-platforms/:id')
  removeCoursePlatform(@Headers('authorization') authorization: string | undefined, @Param('id', new ParseUUIDPipe()) id: string) {
    this.admin.session(authorization);
    return this.jobsService.removeCoursePlatform(id);
  }

  @Get('mock-test-results')
  mockTestResults(@Headers('authorization') authorization?: string) {
    this.admin.session(authorization);
    return this.jobsService.listMockTests();
  }

  @Post('mock-test')
  @ApiOperation({ summary: 'Submit a mock test paper (answer links + snapshots) to Google Sheet 3' })
  async submitMockTest(@Body() dto: SubmitMockTestDto) {
    const result = await this.jobsService.submitMockTest(dto);
    return {
      ...result,
      message: 'Mock test saved to Sheet 3',
    };
  }

  @Post('sync-sheet')
  @ApiOperation({ summary: 'Sync all database applications to Google Sheet' })
  async syncToSheet(@Body('webhookUrl') webhookUrl?: string) {
    return this.jobsService.syncAllToGoogleSheet(webhookUrl);
  }

  @Get('applications/admin/:id/resume')
  adminResume(@Headers('authorization') authorization: string | undefined, @Param('id', new ParseUUIDPipe()) id: string) {
    this.admin.session(authorization);
    return this.jobsService.resumeForAdmin(id);
  }

  @Get('applications/admin')
  adminApplications(@Headers('authorization') authorization: string | undefined, @Query('kind') kind?: string) {
    this.admin.session(authorization);
    return this.jobsService.listApplications(kind === 'interest' ? 'expressed_interest' : 'applied');
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
    @Query('focus') focus?: string,
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

      let items: any[] = [];
      let res: Response | null = null;
      let data: any = null;
      if (focus === 'companies') {
        items = [...(await loadFeaturedJavaJobs(headers))];
        for (let i = items.length - 1; i > 0; i -= 1) {
          const swap = Math.floor(Math.random() * (i + 1));
          const current = items[i];
          items[i] = items[swap];
          items[swap] = current;
        }
        items = items.slice(0, take);
      } else {
        res = await fetch(searchUrl, { headers });
        data = (await res.json().catch(() => null)) as any;
        items = data?.objects || [];
      }

      // If targeted skill search returned 0 items, fallback to broader feed and rank locally
      if (focus !== 'companies' && items.length === 0 && rawTokens.length > 0) {
        const fallbackUrl = `https://www.instahyre.com/api/v1/job_search?offset=${skip}&count=${take}`;
        res = await fetch(fallbackUrl, { headers });
        data = (await res.json().catch(() => null)) as any;
        items = data?.objects || [];
      }

      // Prioritize and rank jobs by candidate's profile skills
      if (focus !== 'companies' && rawTokens.length > 0 && items.length > 0) {
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

