import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApifyProfileDataProvider } from '../profile-retrieval/providers/apify-profile-data.provider';
import { User } from '../auth/entities/user.entity';
import { AddInterviewerDto } from './dto/add-interviewer.dto';
import { ApplyInterviewerDto } from './dto/apply-interviewer.dto';
import { RequestInterviewDto } from './dto/request-interview.dto';
import { JobApplication } from '../jobs/entities/job-application.entity';
import { GoogleMeetService } from './google-meet.service';
import { InterviewRequest } from './interview-request.entity';
import { InterviewerApplication } from './interviewer-application.entity';

@Injectable()
export class InterviewersService {
  private readonly logger = new Logger(InterviewersService.name);
  private tableReady: Promise<void>;

  constructor(
    @InjectRepository(InterviewerApplication)
    private readonly applications: Repository<InterviewerApplication>,
    @InjectRepository(InterviewRequest)
    private readonly requests: Repository<InterviewRequest>,
    @InjectRepository(JobApplication)
    private readonly jobApplications: Repository<JobApplication>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly apify: ApifyProfileDataProvider,
    private readonly googleMeet: GoogleMeetService,
  ) {
    this.tableReady = this.ensureTable();
  }

  async recordings() {
    await this.tableReady;
    const rows = await this.requests.find({ order: { createdAt: 'DESC' } });
    const scheduled = rows.filter((row) => row.meetLink);
    const interviewerIds = [...new Set(scheduled.map((row) => row.interviewerId))];
    const people = interviewerIds.length
      ? await this.applications.find({ where: interviewerIds.map((id) => ({ id })) })
      : [];
    const names = new Map(people.map((person) => [person.id, person.fullName]));
    const listed = [];
    for (const row of scheduled) {
      let files: Array<{ state: string; watchUrl: string; startedAt: string; endedAt: string }> = [];
      let detail = '';
      if (row.meetSpace) {
        try {
          files = await this.googleMeet.recordingsFor(row.meetSpace);
        } catch (error) {
          detail = error instanceof Error ? error.message : 'Recording could not be loaded.';
        }
      }
      if (files.length === 0) {
        listed.push({
          id: row.id,
          candidateName: row.candidateName,
          candidateEmail: row.candidateEmail,
          interviewerName: names.get(row.interviewerId) || '',
          interviewDate: row.interviewDate,
          interviewTime: row.interviewTime,
          meetLink: row.meetLink,
          state: row.meetSpace ? 'WAITING' : 'PASTED_LINK',
          watchUrl: '',
          detail,
        });
        continue;
      }
      files.forEach((file, index) => {
        listed.push({
          id: `${row.id}-${index}`,
          candidateName: row.candidateName,
          candidateEmail: row.candidateEmail,
          interviewerName: names.get(row.interviewerId) || '',
          interviewDate: row.interviewDate,
          interviewTime: row.interviewTime,
          meetLink: row.meetLink,
          state: file.state,
          watchUrl: file.watchUrl,
          startedAt: file.startedAt,
          endedAt: file.endedAt,
          detail: '',
        });
      });
    }
    return listed;
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

  async publicPicks() {
    await this.tableReady;
    const rows = await this.applications.find({
      where: { status: 'APPROVED' },
      order: { createdAt: 'DESC' },
      take: 3,
    });
    for (const row of rows) {
      if (!row.linkedinUrl || (row.companyLogos || '').includes('"title"')) continue;
      const facts = await this.linkedInFacts(row.linkedinUrl, this.slugFrom(row.linkedinUrl), row.currentCompany);
      if (facts.photo) row.photoUrl = facts.photo;
      if (facts.companies.length) {
        row.companyLogos = JSON.stringify(facts.companies);
        row.previousCompanies = facts.previous.join(', ');
      }
      await this.applications.save(row);
    }
    return rows.map((row) => {
      const companies = this.readCompanies(row.companyLogos);
      const current = row.currentCompany.trim().toLowerCase();
      const match = companies.find((company) => {
        const name = company.name.trim().toLowerCase();
        return name === current || name.includes(current) || current.includes(name);
      });
      return {
        id: row.id,
        fullName: row.fullName,
        currentCompany: row.currentCompany,
        currentTitle: match?.title || companies.find((company) => company.title)?.title || '',
        previousCompanies: row.previousCompanies,
        linkedinUrl: row.linkedinUrl,
        photoUrl: row.photoUrl || '',
        companies,
      };
    });
  }

  async requestInterview(dto: RequestInterviewDto) {
    await this.tableReady;
    const interviewer = await this.applications.findOne({ where: { id: dto.interviewerId, status: 'APPROVED' } });
    if (!interviewer) throw new BadRequestException('That interviewer is not available.');
    const date = (dto.date || '').trim();
    const time = (dto.time || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Choose a date.');
    if (!time) throw new BadRequestException('Choose a time.');
    const email = dto.candidateEmail.trim().toLowerCase();
    const existing = await this.requests.findOne({
      where: { interviewerId: interviewer.id, candidateEmail: email, jobTitle: dto.jobTitle.trim(), companyName: dto.companyName.trim() },
    });
    if (existing) return { success: true, message: 'Request already sent.' };
    const meeting = await this.googleMeet.createMeeting();
    await this.requests.save(
      this.requests.create({
        interviewerId: interviewer.id,
        candidateName: dto.candidateName.trim(),
        candidateEmail: email,
        jobTitle: dto.jobTitle.trim(),
        companyName: dto.companyName.trim(),
        interviewDate: date,
        interviewTime: time,
        meetLink: meeting.meetLink,
        meetSpace: meeting.meetSpace,
        note: (dto.note || '').trim(),
      }),
    );
    return { success: true, message: 'Request sent.' };
  }

  async candidateInbox(email: string) {
    await this.tableReady;
    const rows = await this.requests
      .createQueryBuilder('request')
      .where('LOWER(request.candidateEmail) = LOWER(:email)', { email: email.trim() })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
    const interviewerIds = [...new Set(rows.map((row) => row.interviewerId))];
    const people = interviewerIds.length
      ? await this.applications.find({ where: interviewerIds.map((id) => ({ id })) })
      : [];
    const names = new Map(people.map((person) => [person.id, person.fullName]));
    const photos = new Map(people.map((person) => [person.id, person.photoUrl || '']));
    return rows.map((row) => ({
      id: row.id,
      interviewerName: names.get(row.interviewerId) || 'Interviewer',
      photoUrl: photos.get(row.interviewerId) || '',
      jobTitle: row.jobTitle,
      companyName: row.companyName,
      status: row.status || 'REQUESTED',
      interviewDate: row.interviewDate || '',
      interviewTime: row.interviewTime || '',
      note: row.note || '',
      meetLink: row.meetLink || '',
      notice: row.notice === 'RESCHEDULED' ? 'RESCHEDULED' : '',
      createdAt: row.createdAt,
    }));
  }

  async inboxFor(email: string) {
    await this.tableReady;
    const interviewer = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .andWhere('application.status = :status', { status: 'APPROVED' })
      .orderBy('application.createdAt', 'DESC')
      .getOne();
    if (!interviewer) return { approved: false, requests: [] };
    const rows = await this.requests.find({ where: { interviewerId: interviewer.id }, order: { createdAt: 'DESC' } });
    const emails = [...new Set(rows.map((row) => row.candidateEmail.trim().toLowerCase()).filter(Boolean))];
    const applications = emails.length
      ? await this.jobApplications.createQueryBuilder('job').where('LOWER(job.email) IN (:...emails)', { emails }).orderBy('job.createdAt', 'DESC').getMany()
      : [];
    const requests = [];
    for (const row of rows) {
      const sameRole = applications.find((job) => job.email.toLowerCase() === row.candidateEmail.toLowerCase() && job.jobTitle === row.jobTitle && job.companyName === row.companyName);
      const anyResume = applications.find((job) => job.email.toLowerCase() === row.candidateEmail.toLowerCase() && (job.resumeUrl || job.resumeData || job.resumeFileName));
      const file = sameRole || anyResume;
      const profile = await this.savedCandidateProfile(row.candidateEmail, file?.linkedinUrl);
      requests.push({
        id: row.id,
        candidateName: row.candidateName,
        candidateEmail: row.candidateEmail,
        jobTitle: row.jobTitle,
        companyName: row.companyName,
        status: row.status || 'REQUESTED',
        interviewDate: row.interviewDate || '',
        interviewTime: row.interviewTime || '',
        note: row.note || '',
        meetLink: row.meetLink || '',
        notice: row.notice === 'RESCHEDULED' ? 'RESCHEDULED' : '',
        resumeFileName: file?.resumeFileName || '',
        resumeUrl: file?.resumeUrl || file?.resumeData || '',
        photoUrl: profile.photoUrl,
        headline: profile.headline,
        createdAt: row.createdAt,
      });
    }
    return { approved: true, requests };
  }

  async candidateProfile(id: string, email: string) {
    await this.tableReady;
    const interviewer = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .andWhere('application.status = :status', { status: 'APPROVED' })
      .getOne();
    if (!interviewer) throw new BadRequestException('That interviewer is not available.');
    const request = await this.requests.findOne({ where: { id, interviewerId: interviewer.id } });
    if (!request) throw new BadRequestException('Request not found.');
    const application = await this.jobApplications
      .createQueryBuilder('job')
      .where('LOWER(job.email) = LOWER(:email)', { email: request.candidateEmail })
      .andWhere('job.jobTitle = :title', { title: request.jobTitle })
      .andWhere('job.companyName = :company', { company: request.companyName })
      .orderBy('job.createdAt', 'DESC')
      .getOne();
    if (!application) throw new BadRequestException('This candidate has no application on file.');
    return {
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      linkedinUrl: application.linkedinUrl || '',
      currentSalary: application.currentSalary || '',
      expectedSalary: application.expectedSalary || '',
      location: application.location || '',
      interviewingAt: application.interviewingAt || '',
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      resumeFileName: application.resumeFileName || '',
      resumeUrl: application.resumeUrl || '',
      resumeData: application.resumeData || '',
    };
  }

  async acceptRequest(id: string, email: string) {
    await this.tableReady;
    const interviewer = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .andWhere('application.status = :status', { status: 'APPROVED' })
      .getOne();
    if (!interviewer) throw new BadRequestException('That interviewer is not available.');
    const row = await this.requests.findOne({ where: { id, interviewerId: interviewer.id } });
    if (!row) throw new BadRequestException('Request not found.');
    row.status = 'ACCEPTED';
    await this.requests.save(row);
    return { success: true };
  }

  async reschedule(id: string, email: string, schedule: { date?: string; time?: string; note?: string; meetLink?: string }) {
    await this.tableReady;
    const date = (schedule.date || '').trim();
    const time = (schedule.time || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Choose a date.');
    if (!time) throw new BadRequestException('Choose a time.');
    const row = await this.requests.findOne({ where: { id } });
    if (!row) throw new BadRequestException('Request not found.');
    if (row.status === 'REJECTED') throw new BadRequestException('This request is already rejected.');
    const who = email.trim().toLowerCase();
    const interviewer = await this.applications.findOne({ where: { id: row.interviewerId, status: 'APPROVED' } });
    const allowed = row.candidateEmail.toLowerCase() === who || interviewer?.email.toLowerCase() === who;
    if (!allowed) throw new BadRequestException('You cannot change this schedule.');
    row.interviewDate = date;
    row.interviewTime = time;
    if (!row.meetLink) {
      const meeting = await this.googleMeet.createMeeting();
      row.meetLink = meeting.meetLink;
      row.meetSpace = meeting.meetSpace;
    }
    row.note = (schedule.note || '').trim();
    row.notice = 'RESCHEDULED';
    row.noticeFor = who === row.candidateEmail.toLowerCase() ? (interviewer?.email || '') : row.candidateEmail;
    await this.requests.save(row);
    return { success: true, interviewDate: date, interviewTime: time, meetLink: row.meetLink, note: row.note, notice: '' };
  }

  async rejectRequest(id: string, email: string) {
    await this.tableReady;
    const interviewer = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .andWhere('application.status = :status', { status: 'APPROVED' })
      .getOne();
    if (!interviewer) throw new BadRequestException('That interviewer is not available.');
    const row = await this.requests.findOne({ where: { id, interviewerId: interviewer.id } });
    if (!row) throw new BadRequestException('Request not found.');
    row.status = 'REJECTED';
    await this.requests.save(row);
    return { success: true };
  }

  async statusFor(email: string) {
    await this.tableReady;
    const row = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: email.trim() })
      .orderBy('application.createdAt', 'DESC')
      .getOne();
    if (!row) return { found: false };
    if (!row.photoUrl && row.linkedinUrl) {
      const photo = await this.profilePhoto(row.linkedinUrl);
      if (photo) {
        row.photoUrl = photo;
        await this.applications.save(row);
      }
    }
    return { found: true, status: row.status, fullName: row.fullName, photoUrl: row.photoUrl || '' };
  }

  async candidatePhoto(email: string) {
    const user = await this.users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
    if (!user) return { photoUrl: '' };
    if (user.avatarUrl) return { photoUrl: user.avatarUrl };
    const apps = await this.jobApplications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email: user.email })
      .andWhere('application.linkedinUrl IS NOT NULL')
      .orderBy('application.createdAt', 'DESC')
      .getMany();
    const token = (user.name || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
    const match = apps.find((row) => token && (row.linkedinUrl || '').toLowerCase().includes(token));
    const url = match?.linkedinUrl || apps.find((row) => row.linkedinUrl)?.linkedinUrl || '';
    if (!url) return { photoUrl: '' };
    const photo = await this.profilePhoto(url);
    if (photo) {
      user.avatarUrl = photo;
      await this.users.save(user);
    }
    return { photoUrl: photo };
  }

  async addApproved(dto: AddInterviewerDto) {
    await this.tableReady;
    const email = dto.email.trim().toLowerCase();
    const linkedinUrl = this.normalizeLinkedIn(dto.linkedinUrl);
    const slug = this.slugFrom(linkedinUrl);
    const facts = await this.linkedInFacts(linkedinUrl, slug, dto.currentCompany);
    const existing = await this.applications
      .createQueryBuilder('application')
      .where('LOWER(application.email) = LOWER(:email)', { email })
      .orderBy('application.createdAt', 'DESC')
      .getOne();
    const saved = existing
      ? await this.applications.save(Object.assign(existing, {
          fullName: dto.fullName.trim(),
          email,
          linkedinUrl,
          currentCompany: dto.currentCompany.trim(),
          previousCompanies: facts.previous.join(', '),
          photoUrl: facts.photo,
          companyLogos: JSON.stringify(facts.companies),
          status: 'APPROVED',
        }))
      : await this.applications.save(this.applications.create({
          fullName: dto.fullName.trim(),
          email,
          phone: '-',
          linkedinUrl,
          currentCompany: dto.currentCompany.trim(),
          previousCompanies: facts.previous.join(', '),
          photoUrl: facts.photo,
          companyLogos: JSON.stringify(facts.companies),
          status: 'APPROVED',
        }));
    await this.ensureLogin(email, dto.fullName.trim(), dto.password, facts.photo);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      phone: saved.phone,
      linkedinUrl: saved.linkedinUrl,
      currentCompany: saved.currentCompany,
      previousCompanies: saved.previousCompanies,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  private async ensureLogin(email: string, name: string, password: string, photo = '') {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')}`;
    const user = await this.users.findOne({ where: { email } });
    if (user) {
      user.name = name;
      user.passwordHash = passwordHash;
      if (photo) user.avatarUrl = photo;
      await this.users.save(user);
      return;
    }
    await this.users.save(this.users.create({ email, name, passwordHash, avatarUrl: photo || undefined, isPro: false }));
  }

  async apply(dto: ApplyInterviewerDto) {
    await this.tableReady;
    const existing = await this.statusFor(dto.email);
    if (existing.found) {
      throw new BadRequestException('You already applied. Your profile is under review.');
    }
    const linkedinUrl = this.normalizeLinkedIn(dto.linkedinUrl);
    const slug = this.slugFrom(linkedinUrl);
    const facts = await this.linkedInFacts(linkedinUrl, slug, dto.currentCompany);
    const saved = await this.applications.save(
      this.applications.create({
        fullName: dto.fullName.trim(),
        email: dto.email.trim(),
        phone: dto.phone.trim(),
        linkedinUrl,
        currentCompany: dto.currentCompany.trim(),
        previousCompanies: facts.previous.join(', '),
        photoUrl: facts.photo,
        companyLogos: JSON.stringify(facts.companies),
        status: 'UNDER_REVIEW',
      }),
    );
    await this.syncSheet(saved);
    return {
      success: true,
      message: 'Application submitted successfully. Profile is under review.',
      id: saved.id,
      previousCompanies: facts.previous,
    };
  }

  private async linkedInFacts(url: string, slug: string, currentCompany: string) {
    try {
      const result = await this.apify.fetchProfile(url, slug);
      const names = (result.data?.experiences || [])
        .map((item) => item.company.trim())
        .filter(Boolean);
      const current = currentCompany.trim().toLowerCase();
      const companies = (result.data?.experiences || [])
        .map((item) => ({ name: item.company.trim(), logo: item.logo || '', title: item.title && item.title !== 'Role' ? item.title : '' }))
        .filter((item) => item.name);
      const unique = companies.filter((item, index) => companies.findIndex((other) => other.name.toLowerCase() === item.name.toLowerCase()) === index).slice(0, 5);
      return {
        previous: [...new Set(names.filter((name) => name.toLowerCase() !== current))],
        photo: result.data?.profilePictureUrl || '',
        companies: unique,
      };
    } catch (error) {
      this.logger.warn(`LinkedIn experience lookup failed: ${error instanceof Error ? error.message : error}`);
      return { previous: [] as string[], photo: '', companies: [] as Array<{ name: string; logo: string; title: string }> };
    }
  }

  private async savedCandidateProfile(email: string, linkedinUrl?: string) {
    const user = await this.users
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
    let photoUrl = user?.avatarUrl || '';
    let headline = user?.headline || '';
    if (!linkedinUrl) return { photoUrl, headline };
    try {
      const slug = this.slugFrom(linkedinUrl);
      const rows = await this.applications.query(
        `SELECT id, profilePictureUrl FROM candidates WHERE normalizedProfileUrl LIKE ? OR submittedProfileUrl LIKE ? ORDER BY updatedAt DESC LIMIT 1`,
        [`%${slug}%`, `%${slug}%`],
      ) as Array<{ id: string; profilePictureUrl?: string }>;
      const saved = rows[0];
      if (saved?.profilePictureUrl) photoUrl = saved.profilePictureUrl;
      if (saved?.id) {
        const facts = await this.applications.query(
          `SELECT factText FROM candidate_facts WHERE candidateId = ? AND category = 'headline' ORDER BY createdAt DESC LIMIT 1`,
          [saved.id],
        ) as Array<{ factText?: string }>;
        if (facts[0]?.factText) headline = facts[0].factText;
      }
    } catch (error) {
      this.logger.warn(`Saved profile lookup failed: ${error instanceof Error ? error.message : error}`);
    }
    return { photoUrl, headline };
  }

  private readCompanies(raw: string) {
    try {
      const parsed = JSON.parse(raw || '[]') as Array<{ name?: string; logo?: string; title?: string }>;
      return parsed.filter((item) => item.name).map((item) => ({ name: item.name || '', logo: item.logo || '', title: item.title || '' }));
    } catch {
      return [];
    }
  }

  private async profilePhoto(url: string) {
    try {
      const slug = this.slugFrom(url);
      const result = await this.apify.fetchProfile(url, slug);
      return result.data?.profilePictureUrl || '';
    } catch (error) {
      this.logger.warn(`LinkedIn photo lookup failed: ${error instanceof Error ? error.message : error}`);
      return '';
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
    const createdAt = this.applications.manager.connection.options.type === 'postgres'
      ? 'timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP'
      : 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)';
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
        photo_url varchar(1000) NOT NULL DEFAULT '',
        created_at ${createdAt}
      )
    `);
    try {
      await this.applications.query(`ALTER TABLE interviewer_applications ADD COLUMN photo_url varchar(1000) NOT NULL DEFAULT ''`);
    } catch {
      /* column already exists */
    }
    try {
      await this.applications.query(`ALTER TABLE interviewer_applications ADD COLUMN company_logos text`);
    } catch {
      /* column already exists */
    }
    await this.applications.query(`
      CREATE TABLE IF NOT EXISTS interview_requests (
        id varchar(36) NOT NULL PRIMARY KEY,
        interviewer_id varchar(36) NOT NULL,
        candidate_name varchar(255) NOT NULL,
        candidate_email varchar(255) NOT NULL,
        job_title varchar(255) NOT NULL,
        company_name varchar(255) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'REQUESTED',
        created_at ${createdAt}
      )
    `);
    try {
      await this.applications.query(`ALTER TABLE interview_requests ADD COLUMN status varchar(20) NOT NULL DEFAULT 'REQUESTED'`);
    } catch { /* column already exists */ }
    for (const statement of [
      `ALTER TABLE interview_requests ADD COLUMN interview_date varchar(20) NOT NULL DEFAULT ''`,
      `ALTER TABLE interview_requests ADD COLUMN interview_time varchar(20) NOT NULL DEFAULT ''`,
      `ALTER TABLE interview_requests ADD COLUMN note text`,
      `ALTER TABLE interview_requests ADD COLUMN meet_link varchar(1000) NOT NULL DEFAULT ''`,
      `ALTER TABLE interview_requests ADD COLUMN meet_space varchar(200) NOT NULL DEFAULT ''`,
      `ALTER TABLE interview_requests ADD COLUMN notice varchar(40) NOT NULL DEFAULT ''`,
      `ALTER TABLE interview_requests ADD COLUMN notice_for varchar(255) NOT NULL DEFAULT ''`,
    ]) {
      try { await this.applications.query(statement); } catch { /* column already exists */ }
    }
    await this.applications.query(`
      CREATE TABLE IF NOT EXISTS google_meet_organizer (
        id int NOT NULL PRIMARY KEY,
        email varchar(255) NOT NULL,
        refresh_token text NOT NULL
      )
    `);
  }
}
