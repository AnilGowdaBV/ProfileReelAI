import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApifyProfileDataProvider } from '../profile-retrieval/providers/apify-profile-data.provider';
import { ApplyInterviewerDto } from './dto/apply-interviewer.dto';
import { InterviewerApplication } from './interviewer-application.entity';

@Injectable()
export class InterviewersService {
  private readonly logger = new Logger(InterviewersService.name);
  private tableReady: Promise<void>;

  constructor(
    @InjectRepository(InterviewerApplication)
    private readonly applications: Repository<InterviewerApplication>,
    private readonly apify: ApifyProfileDataProvider,
  ) {
    this.tableReady = this.ensureTable();
  }

  async list() {
    await this.tableReady;
    return this.applications.find({ order: { createdAt: 'DESC' } });
  }

  async setStatus(id: string, status: string) {
    await this.tableReady;
    const allowed = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!allowed.includes(status)) throw new BadRequestException('Unknown status.');
    const row = await this.applications.findOne({ where: { id } });
    if (!row) throw new BadRequestException('Application not found.');
    row.status = status;
    return this.applications.save(row);
  }

  async statusFor(email: string) {
    await this.tableReady;
    const row = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .orderBy('application.createdAt', 'DESC')
      .getOne();
    if (!row) return { found: false };
    return { found: true, status: row.status, fullName: row.fullName };
  }

  async apply(dto: ApplyInterviewerDto) {
    await this.tableReady;
    const existing = await this.statusFor(dto.email);
    if (existing.found) {
      throw new BadRequestException('You already applied. Your profile is under review.');
    }
    const linkedinUrl = this.normalizeLinkedIn(dto.linkedinUrl);
    const slug = this.slugFrom(linkedinUrl);
    const previous = await this.previousCompanies(linkedinUrl, slug, dto.currentCompany);
    const saved = await this.applications.save(
      this.applications.create({
        fullName: dto.fullName.trim(),
        email: dto.email.trim(),
        phone: dto.phone.trim(),
        linkedinUrl,
        currentCompany: dto.currentCompany.trim(),
        previousCompanies: previous.join(', '),
        status: 'UNDER_REVIEW',
      }),
    );
    await this.syncSheet(saved);
    return {
      success: true,
      message: 'Application submitted successfully. Profile is under review.',
      id: saved.id,
      previousCompanies: previous,
    };
  }

  private async previousCompanies(url: string, slug: string, currentCompany: string) {
    try {
      const result = await this.apify.fetchProfile(url, slug);
      const names = (result.data?.experiences || [])
        .map((item) => item.company.trim())
        .filter(Boolean);
      const current = currentCompany.trim().toLowerCase();
      return [...new Set(names.filter((name) => name.toLowerCase() !== current))];
    } catch (error) {
      this.logger.warn(`LinkedIn experience lookup failed: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }

  private async syncSheet(row: InterviewerApplication) {
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (!webhookUrl) return;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'INTERVIEWER',
        sheetName: 'Sheet4',
        sheetIndex: 4,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        linkedinUrl: row.linkedinUrl,
        currentCompany: row.currentCompany,
        previousCompanies: row.previousCompanies,
        status: 'Under review',
      }),
    });
    if (!response.ok) {
      this.logger.warn(`Sheet4 webhook failed: ${response.status}`);
    }
  }

  private normalizeLinkedIn(raw: string) {
    const value = raw.trim();
    let parsed: URL;
    try {
      parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    } catch {
      throw new BadRequestException('Enter a LinkedIn profile URL.');
    }
    if (!parsed.hostname.endsWith('linkedin.com') || !parsed.pathname.includes('/in/')) {
      throw new BadRequestException('Enter a LinkedIn profile URL.');
    }
    return parsed.toString();
  }

  private slugFrom(url: string) {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    const index = parts.indexOf('in');
    return parts[index + 1] || 'profile';
  }

  private async ensureTable() {
    await this.applications.query(`
      CREATE TABLE IF NOT EXISTS interviewer_applications (
        id varchar(36) NOT NULL PRIMARY KEY,
        full_name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        phone varchar(50) NOT NULL,
        linkedin_url varchar(500) NOT NULL,
        current_company varchar(255) NOT NULL,
        previous_companies text,
        status varchar(40) NOT NULL DEFAULT 'UNDER_REVIEW',
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);
  }
}
