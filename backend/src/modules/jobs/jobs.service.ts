import { Injectable, NotFoundException, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  GenerationJob,
  JobStatus,
  JobStage,
} from './entities/generation-job.entity';
import { JobApplication } from './entities/job-application.entity';
import { MockTestResult } from './entities/mock-test-result.entity';
import { CoursePlatform } from './entities/course-platform.entity';
import { CreateCoursePlatformDto } from './dto/create-course-platform.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { SubmitMockTestDto } from './dto/submit-mock-test.dto';
import { R2StorageService } from '../storage/r2-storage.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private mockTableReady: Promise<void>;
  private courseTableReady: Promise<void>;

  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobRepo: Repository<GenerationJob>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(MockTestResult)
    private readonly mockResults: Repository<MockTestResult>,
    @InjectRepository(CoursePlatform)
    private readonly coursePlatforms: Repository<CoursePlatform>,
    private readonly r2Storage: R2StorageService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {
    this.mockTableReady = this.ensureMockTestTable();
    this.courseTableReady = this.ensureCoursePlatforms();
  }

  async createJob(candidateId: string): Promise<GenerationJob> {
    const job = this.jobRepo.create({
      candidateId,
      status: JobStatus.PROCESSING,
      currentStage: JobStage.URL_VALIDATION,
    });
    return this.jobRepo.save(job);
  }

  async updateJobStage(
    jobId: string,
    stage: JobStage | string,
    status: JobStatus = JobStatus.PROCESSING,
    error?: { code?: string; message?: string },
  ): Promise<GenerationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    job.currentStage = stage;
    job.status = status;
    if (error) {
      job.errorCode = error.code;
      job.errorMessage = error.message;
    }

    return this.jobRepo.save(job);
  }

  async jobApplyNeedsPayment(email: string, linkedinUrl: string): Promise<boolean> {
    const postgres = this.applicationRepo.manager.connection.options.type === 'postgres';
    await this.applicationRepo.query(
      `CREATE TABLE IF NOT EXISTS job_apply_passes (
        id varchar(36) PRIMARY KEY,
        email varchar(255) NOT NULL,
        linkedin_url varchar(500) NOT NULL DEFAULT '',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    const normalized = email.trim().toLowerCase();
    const linkedin = linkedinUrl.trim().toLowerCase();
    if (!normalized && !linkedin) return false;
    const paid = await this.applicationRepo.query(
      postgres
        ? `SELECT id FROM job_apply_passes WHERE LOWER(email) = $1 OR ($2 <> '' AND LOWER(linkedin_url) = $2) LIMIT 1`
        : `SELECT id FROM job_apply_passes WHERE LOWER(email) = ? OR (? <> '' AND LOWER(linkedin_url) = ?) LIMIT 1`,
      postgres ? [normalized, linkedin] : [normalized, linkedin, linkedin],
    );
    if (paid.length) return false;
    const rows = await this.applicationRepo.query(
      postgres
        ? `SELECT COUNT(*) AS total FROM job_applications WHERE status = 'applied' AND (LOWER(email) = $1 OR ($2 <> '' AND LOWER(linkedin_url) = $2))`
        : `SELECT COUNT(*) AS total FROM job_applications WHERE status = 'applied' AND (LOWER(email) = ? OR (? <> '' AND LOWER(linkedin_url) = ?))`,
      postgres ? [normalized, linkedin] : [normalized, linkedin, linkedin],
    );
    return Number(rows[0]?.total || 0) >= 3;
  }

  private async assertCanApply(email: string, linkedinUrl: string) {
    if (await this.jobApplyNeedsPayment(email, linkedinUrl)) {
      throw new HttpException('Pay ₹100 to keep applying for jobs.', HttpStatus.PAYMENT_REQUIRED);
    }
  }

  async findById(jobId: string): Promise<GenerationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  async applyForJob(dto: CreateJobApplicationDto): Promise<JobApplication> {
    if (dto.applicationType === 'Job Application') {
      await this.assertCanApply(dto.email, dto.linkedinUrl || '');
    }
    let resumeUrl: string | null = null;
    if (dto.resumeData && dto.resumeFileName) {
      resumeUrl = await this.supabaseStorage.uploadResume(dto.resumeFileName, dto.resumeData);
      if (!resumeUrl) {
        resumeUrl = await this.r2Storage.uploadResume(dto.resumeFileName, dto.resumeData);
      }
    }

    const application = this.applicationRepo.create({
      jobId: dto.jobId,
      jobTitle: dto.jobTitle,
      companyName: dto.companyName,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      linkedinUrl: dto.linkedinUrl || '',
      currentSalary: dto.currentSalary || '',
      expectedSalary: dto.expectedSalary || '',
      location: dto.location || '',
      interviewingAt: dto.interviewingAt?.trim() || '',
      resumeFileName: dto.resumeFileName || '',
      resumeUrl: resumeUrl || '',
      resumeData: dto.resumeData || null,
      status: dto.applicationType === 'Express Interest' || dto.sheetName === 'Sheet2' ? 'expressed_interest' : 'applied',
    });

    const saved = await this.applicationRepo.save(application);
    this.logger.log(`Saved ${dto.applicationType || 'job application'} for ${dto.fullName} -> ${dto.jobTitle} at ${dto.companyName}`);

    // Forward to Google Sheet Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const isExpressInterest =
          dto.applicationType === 'Express Interest' ||
          dto.sheetName === 'Sheet2' ||
          dto.sheetName?.toLowerCase().includes('interest');

        const targetSheet = isExpressInterest ? 'Sheet2' : (dto.sheetName || 'Sheet1');

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            applicationId: saved.id,
            jobTitle: saved.jobTitle,
            companyName: saved.companyName,
            fullName: saved.fullName,
            email: saved.email,
            phone: saved.phone,
            linkedinUrl: saved.linkedinUrl,
            currentSalary: saved.currentSalary,
            expectedSalary: saved.expectedSalary,
            location: saved.location,
            interviewingAt: saved.interviewingAt || '',
            resumeFileName: saved.resumeFileName,
            resumeUrl: resumeUrl || '',
            status: isExpressInterest ? 'Expressed Interest' : 'Applied',
            applicationType: isExpressInterest ? 'Express Interest' : 'Job Application',
            action: isExpressInterest ? 'EXPRESS_INTEREST' : 'JOB_APPLICATION',
            sheet: targetSheet,
            sheetName: targetSheet,
            targetSheet: targetSheet,
            tab: targetSheet,
            sheetIndex: isExpressInterest ? 2 : 1,
          }),
        });
        this.logger.log(`Successfully synced ${isExpressInterest ? 'Express Interest' : 'Job Application'} to Google Sheet (${targetSheet})!`);
      } catch (err: any) {
        this.logger.warn(`Failed to push to Google Sheet webhook: ${err.message}`);
      }
    }

    return saved;
  }

  async listMockTests() {
    await this.mockTableReady;
    return this.mockResults.find({ order: { createdAt: 'DESC' } });
  }

  async submitMockTest(dto: SubmitMockTestDto): Promise<{ success: boolean; sheet: string; answers: number }> {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new BadRequestException('Google Sheet webhook is not configured');
    }

    const answers = [];
    const usedSlugs = new Set<string>();
    for (let index = 0; index < dto.answers.length; index += 1) {
      const answer = dto.answers[index];
      const onPlatform = Boolean(answer.code?.trim()) && !answer.submissionUrl?.trim();
      const submissionUrl = onPlatform
        ? 'Solved on platform'
        : this.requireLeetCodeSubmissionUrl(answer.submissionUrl || '', answer.leetcodeUrl || '');
      if (!onPlatform) {
        const slug = this.extractLeetCodeSlug(submissionUrl);
        if (!slug) {
          throw new BadRequestException('Each submissions link must include the LeetCode problem path');
        }
        if (usedSlugs.has(slug)) {
          throw new BadRequestException('Each question needs its own submissions link');
        }
        usedSlugs.add(slug);
      }
      let snapshotUrl = '';
      if (answer.snapshotData) {
        const fileName = `${dto.testId}_${answer.questionId}.jpg`;
        snapshotUrl =
          (await this.supabaseStorage.uploadMockSnapshot(fileName, answer.snapshotData, 'image/jpeg')) ||
          (await this.r2Storage.uploadResume(fileName, answer.snapshotData, 'image/jpeg')) ||
          '';
      }
      answers.push({
        questionNo: index + 1,
        questionId: answer.questionId,
        number: answer.number || '',
        title: answer.title,
        difficulty: answer.difficulty,
        pattern: answer.pattern || '',
        leetcodeUrl: answer.leetcodeUrl,
        submissionUrl,
        snapshotUrl,
        caseNote: answer.caseNote || '',
      });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      action: 'MOCK_TEST',
      applicationType: 'Mock Test',
      sheet: 'Sheet3',
      sheetName: 'Sheet3',
      targetSheet: 'Sheet3',
      tab: 'Sheet3',
      sheetIndex: 3,
      testId: dto.testId,
      verdict: dto.verdict || '',
      verdictReason: dto.verdictReason || '',
      tabWarnings: dto.tabWarnings || '0',
      pasteWarnings: dto.pasteWarnings || '0',
      userId: dto.userId || '',
      fullName: dto.fullName,
      email: dto.email,
      linkedinUrl: dto.linkedinUrl || '',
      answers,
    };

    const tabs = Number(dto.tabWarnings || 0);
    const pastes = Number(dto.pasteWarnings || 0);
    const notes = [
      pastes > 0 ? `tried copy paste ${pastes}` : '',
      tabs > 0 ? `tried switching tab ${tabs}` : '',
    ].filter(Boolean);
    const status = notes.length ? `${dto.verdict || 'Submitted'} — ${notes.join(', ')}` : dto.verdict || 'Submitted';
    await this.mockTableReady;
    await this.mockResults.save(
      answers.map((answer) =>
        this.mockResults.create({
          fullName: dto.fullName,
          email: dto.email,
          linkedinUrl: dto.linkedinUrl || '',
          testId: dto.testId,
          questionNo: answer.questionNo,
          questionId: answer.questionId,
          difficulty: answer.difficulty,
          title: answer.title,
          pattern: answer.pattern,
          leetcodeUrl: answer.leetcodeUrl || '',
          submissionUrl: answer.submissionUrl,
          status,
          code: dto.answers.find((item) => item.questionId === answer.questionId)?.code || '',
          caseNote: answer.caseNote,
        }),
      ),
    );

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.warn(`Mock test Sheet3 webhook failed: ${res.status} ${body}`);
      throw new BadRequestException('Could not save this mock test to Sheet 3');
    }

    this.logger.log(`Synced mock test for ${dto.email} to Google Sheet (Sheet3) with ${answers.length} answers`);
    return { success: true, sheet: 'Sheet3', answers: answers.length };
  }

  async listCoursePlatforms() {
    await this.courseTableReady;
    return this.coursePlatforms.find({ order: { createdAt: 'ASC' } });
  }

  async addCoursePlatform(dto: CreateCoursePlatformDto) {
    await this.courseTableReady;
    const name = dto.name.trim();
    const url = this.normalizeCourseUrl(dto.url);
    const purpose = (dto.purpose || '').trim();
    const recommendFor = this.normalizeRecommendFor(dto.recommendFor);
    if (!name || !url) {
      throw new BadRequestException('Name and website link are required');
    }
    if (!recommendFor) {
      throw new BadRequestException('Choose which failed paper this platform is for');
    }
    const exists = await this.coursePlatforms.findOne({ where: [{ url }, { name }] });
    if (exists) {
      throw new BadRequestException('That course platform is already saved');
    }
    return this.coursePlatforms.save(this.coursePlatforms.create({ name, url, purpose, recommendFor }));
  }

  async updateCoursePlatform(id: string, dto: CreateCoursePlatformDto) {
    await this.courseTableReady;
    const row = await this.coursePlatforms.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Course platform not found');
    }
    const name = dto.name.trim();
    const url = this.normalizeCourseUrl(dto.url);
    const purpose = (dto.purpose || '').trim();
    const recommendFor = this.normalizeRecommendFor(dto.recommendFor);
    if (!name || !url) {
      throw new BadRequestException('Name and website link are required');
    }
    if (!recommendFor) {
      throw new BadRequestException('Choose which failed paper this platform is for');
    }
    const exists = await this.coursePlatforms.findOne({ where: [{ url, id: Not(id) }, { name, id: Not(id) }] });
    if (exists) {
      throw new BadRequestException('That course platform is already saved');
    }
    row.name = name;
    row.url = url;
    row.purpose = purpose;
    row.recommendFor = recommendFor;
    return this.coursePlatforms.save(row);
  }

  async removeCoursePlatform(id: string) {
    await this.courseTableReady;
    const row = await this.coursePlatforms.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException('Course platform not found');
    }
    await this.coursePlatforms.remove(row);
    return { success: true };
  }

  private normalizeRecommendFor(raw?: string) {
    const allowed = new Set(['react', 'java', 'golang', 'dataengineer', 'sdet', 'dataanalyst', 'devops']);
    const picked = [...new Set(String(raw || '').toLowerCase().split(/[^a-z]+/).filter((part) => allowed.has(part)))];
    return picked.join(',');
  }

  private normalizeCourseUrl(raw: string) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return '';
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return new URL(withProtocol).toString();
    } catch {
      throw new BadRequestException('Enter a valid website link');
    }
  }

  private async ensureCoursePlatforms() {
    await this.coursePlatforms.query(`
      CREATE TABLE IF NOT EXISTS course_platforms (
        id varchar(36) NOT NULL PRIMARY KEY,
        name varchar(255) NOT NULL,
        url varchar(500) NOT NULL,
        purpose varchar(255) NOT NULL DEFAULT '',
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
    await this.coursePlatforms.query(`
      ALTER TABLE course_platforms
      ADD COLUMN recommend_for varchar(80) NOT NULL DEFAULT ''
    `).catch(() => undefined);
    await this.coursePlatforms.query(`
      UPDATE course_platforms SET recommend_for = 'java'
      WHERE recommend_for = '' AND (purpose LIKE '%DSA%' OR purpose LIKE '%LLD%' OR purpose LIKE '%Java%')
    `);
    await this.coursePlatforms.query(`
      UPDATE course_platforms SET recommend_for = 'react'
      WHERE recommend_for = '' AND (purpose LIKE '%full%' OR purpose LIKE '%React%' OR purpose LIKE '%front%')
    `);
    await this.coursePlatforms.query(`
      UPDATE course_platforms SET recommend_for = 'golang'
      WHERE recommend_for = '' AND (purpose LIKE '%System%' OR purpose LIKE '%DevOps%' OR purpose LIKE '%Go%')
    `);
    const count = await this.coursePlatforms.count();
    if (count > 0) return;
    await this.coursePlatforms.save([
      this.coursePlatforms.create({ name: 'CodeZym', url: 'https://codezym.com/', purpose: 'LLD', recommendFor: 'java' }),
      this.coursePlatforms.create({ name: 'Fanout', url: 'https://fanout.sh/', purpose: 'System Design + AI', recommendFor: 'golang' }),
      this.coursePlatforms.create({ name: 'TakeUForward', url: 'https://takeuforward.org/', purpose: 'DSA', recommendFor: 'java' }),
      this.coursePlatforms.create({ name: 'LLDCoding', url: 'https://lldcoding.com/', purpose: 'LLD', recommendFor: 'java' }),
      this.coursePlatforms.create({ name: 'neoG Camp', url: 'https://neog.camp/', purpose: 'Full-stack development', recommendFor: 'react' }),
    ]);
  }

  private async ensureMockTestTable() {
    await this.mockResults.query(`
      CREATE TABLE IF NOT EXISTS mock_test_results (
        id varchar(36) NOT NULL PRIMARY KEY,
        full_name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        linkedin_url varchar(500) NOT NULL DEFAULT '',
        test_id varchar(40) NOT NULL,
        question_no int NOT NULL,
        question_id varchar(80) NOT NULL,
        difficulty varchar(40) NOT NULL,
        title varchar(255) NOT NULL,
        pattern varchar(120) NOT NULL DEFAULT '',
        leetcode_url varchar(500) NOT NULL DEFAULT '',
        submission_url varchar(500) NOT NULL DEFAULT '',
        status text NOT NULL,
        code text,
        case_note text,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
  }

  private extractLeetCodeSlug(raw: string): string | null {
    try {
      const parsed = new URL(String(raw || '').trim());
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if (host !== 'leetcode.com') return null;
      const parts = parsed.pathname.toLowerCase().split('/').filter(Boolean);
      const problemsIdx = parts.indexOf('problems');
      const slug = problemsIdx >= 0 ? parts[problemsIdx + 1] : '';
      if (!slug || slug === 'submissions') return null;
      return slug;
    } catch {
      return null;
    }
  }

  private requireLeetCodeSubmissionUrl(raw: string, expectedProblemUrl?: string): string {
    const value = String(raw || '').trim();
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new BadRequestException('Each question needs a valid LeetCode submitted-answer link');
    }
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const parts = parsed.pathname.toLowerCase().split('/').filter(Boolean);
    const problemsIdx = parts.indexOf('problems');
    const slug = problemsIdx >= 0 ? parts[problemsIdx + 1] : '';
    const rest = problemsIdx >= 0 ? parts.slice(problemsIdx + 2) : [];
    if (host !== 'leetcode.com' || !slug || slug === 'submissions' || !rest.includes('submissions')) {
      throw new BadRequestException('Use the LeetCode submissions link for each answered question');
    }
    const expected = expectedProblemUrl ? this.extractLeetCodeSlug(expectedProblemUrl) : null;
    if (expected && slug !== expected) {
      throw new BadRequestException("Each submissions link must match that question's LeetCode problem");
    }
    return parsed.toString();
  }

  async listApplications(status: 'applied' | 'expressed_interest') {
    const rows = await this.applicationRepo.find({
      where: { status },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'jobTitle',
        'companyName',
        'fullName',
        'email',
        'phone',
        'linkedinUrl',
        'location',
        'currentSalary',
        'expectedSalary',
        'interviewingAt',
        'resumeFileName',
        'status',
        'createdAt',
      ],
    });
    const flags = await this.applicationRepo
      .createQueryBuilder('app')
      .select('app.id', 'id')
      .addSelect(
        "(app.resume_data IS NOT NULL AND app.resume_data <> '') OR (app.resume_url IS NOT NULL AND app.resume_url <> '')",
        'hasResume',
      )
      .where('app.status = :status', { status })
      .getRawMany<{ id: string; hasResume: number | string }>();
    const withResume = new Set(flags.filter((row) => Number(row.hasResume) === 1).map((row) => row.id));
    return rows.map((row) => ({ ...row, hasResume: withResume.has(row.id) }));
  }

  async resumeForAdmin(id: string) {
    const row = await this.applicationRepo.findOne({
      where: { id },
      select: ['id', 'resumeFileName', 'resumeUrl', 'resumeData'],
    });
    if (!row || (!row.resumeData && !row.resumeUrl)) {
      throw new NotFoundException('No resume saved for this application');
    }
    return {
      fileName: row.resumeFileName || 'Resume.pdf',
      resumeUrl: row.resumeUrl || '',
      resumeData: row.resumeData || '',
    };
  }

  async getAllApplications(): Promise<JobApplication[]> {
    return this.applicationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getApplicationById(id: string): Promise<JobApplication> {
    const app = await this.applicationRepo.findOne({ where: { id } });
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return app;
  }

  async syncAllToGoogleSheet(customWebhookUrl?: string): Promise<{ success: boolean; count: number; message: string }> {
    const webhookUrl = customWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) {
      return {
        success: false,
        count: 0,
        message: 'Google Sheet Webhook URL not configured yet in backend/.env',
      };
    }

    const apps = await this.applicationRepo.find({ order: { createdAt: 'ASC' } });
    let pushed = 0;
    for (const app of apps) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: app.createdAt.toISOString(),
            applicationId: app.id,
            jobTitle: app.jobTitle,
            companyName: app.companyName,
            fullName: app.fullName,
            email: app.email,
            phone: app.phone,
            linkedinUrl: app.linkedinUrl || '',
            currentSalary: app.currentSalary || '',
            expectedSalary: app.expectedSalary || '',
            location: app.location || '',
            interviewingAt: app.interviewingAt || '',
            resumeFileName: app.resumeFileName || '',
            resumeUrl: app.resumeUrl || '',
            status: 'Applied',
          }),
        });
        pushed++;
      } catch (err: any) {
        this.logger.warn(`Failed to push application ${app.id} to sheet: ${err.message}`);
      }
    }

    return {
      success: true,
      count: pushed,
      message: `Successfully synced ${pushed} application(s) to Google Sheet!`,
    };
  }
}
