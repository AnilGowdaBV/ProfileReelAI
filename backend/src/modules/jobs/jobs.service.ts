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

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobRepo: Repository<GenerationJob>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
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
      resumeData: dto.resumeData || null,
      status: 'applied',
    });

    const saved = await this.applicationRepo.save(application);
    this.logger.log(`Saved job application for ${dto.fullName} -> ${dto.jobTitle} at ${dto.companyName}`);

    // Forward to Google Sheet Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (webhookUrl) {
      try {
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
            status: 'Applied',
          }),
        });
        this.logger.log(`Successfully synced application to Google Sheet webhook!`);
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
}
