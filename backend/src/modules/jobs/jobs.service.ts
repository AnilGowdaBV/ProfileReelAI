import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenerationJob,
  JobStatus,
  JobStage,
} from './entities/generation-job.entity';
import { JobApplication } from './entities/job-application.entity';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { R2StorageService } from '../storage/r2-storage.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobRepo: Repository<GenerationJob>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    private readonly r2Storage: R2StorageService,
    private readonly supabaseStorage: SupabaseStorageService,
  ) {}

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

  async findById(jobId: string): Promise<GenerationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  async applyForJob(dto: CreateJobApplicationDto): Promise<JobApplication> {
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
