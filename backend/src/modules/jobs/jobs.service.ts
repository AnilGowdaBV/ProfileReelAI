import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenerationJob,
  JobStatus,
  JobStage,
} from './entities/generation-job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobRepo: Repository<GenerationJob>,
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
}
