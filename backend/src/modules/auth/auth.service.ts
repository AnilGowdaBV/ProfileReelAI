import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { R2StorageService } from '../storage/r2-storage.service';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly supabaseStorage: SupabaseStorageService,
    private readonly r2Storage: R2StorageService,
  ) {
    void this.ensureProfileColumns();
    this.clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET') || '';

    const backendUrl =
      this.configService.get<string>('BACKEND_URL') ||
      process.env.RENDER_EXTERNAL_URL ||
      'http://localhost:3000';

    this.redirectUri = `${backendUrl}/api/auth/linkedin/callback`;
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5174';

    this.logger.log(`LinkedIn Auth Initialized: Client ID: ${this.clientId ? this.clientId.substring(0, 6) + '***' : 'Missing'}, Redirect: ${this.redirectUri}`);
  }

  /**
   * Generate official LinkedIn OpenID Connect authorization URL
   */
  getLinkedInAuthUrl(state?: string): string {
    if (!this.clientId) {
      throw new BadRequestException('LINKEDIN_CLIENT_ID is not configured');
    }

    const stateParam = state || crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid profile email',
      state: stateParam,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Handle LinkedIn OAuth 2.0 callback, exchange code, fetch profile & persist to database
   */
  async handleLinkedInCallback(code: string, customRedirectUri?: string): Promise<User> {
    this.logger.log(`Exchanging LinkedIn authorization code for access token...`);

    const redirectUri = customRedirectUri || this.redirectUri;

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      this.logger.error(`Failed to exchange LinkedIn code: ${JSON.stringify(tokenData)}`);
      throw new BadRequestException(tokenData.error_description || 'Failed to exchange LinkedIn code');
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile & email via OpenID Connect UserInfo
    this.logger.log(`Fetching LinkedIn user profile via OpenID Connect...`);
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !userInfo.sub) {
      this.logger.error(`Failed to fetch LinkedIn userinfo: ${JSON.stringify(userInfo)}`);
      throw new BadRequestException('Failed to retrieve user profile from LinkedIn');
    }

    this.logger.log(`Retrieved LinkedIn user: ${userInfo.name} (${userInfo.email}) [ID: ${userInfo.sub}]`);

    const linkedinId = userInfo.sub;
    const email = userInfo.email || `${linkedinId}@linkedin.user`;
    const name = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'LinkedIn Member';
    const avatarUrl = userInfo.picture || '';

    // 3. Upsert user in MySQL database
    let user = await this.userRepository.findOne({
      where: [{ linkedinId }, { email }],
    });

    if (user) {
      user.name = name;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.linkedinId = linkedinId;
      await this.userRepository.save(user);
      this.logger.log(`Updated existing MySQL user: ${user.id} (${user.email})`);
    } else {
      user = this.userRepository.create({
        email,
        name,
        avatarUrl,
        linkedinId,
        headline: 'Verified LinkedIn Professional',
        isPro: false,
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new MySQL user: ${user.id} (${user.email})`);
    }

    return user;
  }

  toPublic(user: User) {
    const linkedinUrl = (user.linkedinProfile || '').trim()
      || (user.linkedinId ? `https://linkedin.com/in/${user.linkedinId}` : '');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      headline: user.headline || '',
      avatarUrl: user.avatarUrl,
      linkedinUrl,
      isPro: user.isPro,
      proExpiresAt: user.proExpiresAt,
      profileReady: Boolean(user.profileReady),
      jobTrack: user.jobTrack || '',
      jobSkill: user.jobSkill || '',
    };
  }

  async saveCareerProfile(input: {
    userId: string;
    name: string;
    linkedinUrl: string;
    track: string;
    resumeFileName: string;
    resumeData: string;
  }) {
    const user = await this.userRepository.findOne({ where: { id: input.userId } });
    if (!user) throw new BadRequestException('User not found');
    const track = input.track === 'frontend' ? 'frontend' : input.track === 'backend' ? 'backend' : '';
    const name = input.name.trim();
    const linkedinUrl = input.linkedinUrl.trim();
    if (!name || !linkedinUrl || !track) {
      throw new BadRequestException('Name, LinkedIn, and interest are required.');
    }
    if (!input.resumeData && !user.resumeUrl) {
      throw new BadRequestException('Upload your resume.');
    }
    if (input.resumeData) {
      const clean = input.resumeData.replace(/^data:.*?;base64,/, '');
      const file = Buffer.from(clean, 'base64');
      if (!file.length || file.length > 5 * 1024 * 1024) {
        throw new BadRequestException('Upload a resume under 5 MB.');
      }
      const resumeUrl = (await this.supabaseStorage.uploadResume(input.resumeFileName || 'resume.pdf', file))
        || (await this.r2Storage.uploadResume(input.resumeFileName || 'resume.pdf', file))
        || '';
      user.jobSkill = this.skillFromResume(file.toString('latin1').toLowerCase(), track);
      user.resumeFileName = (input.resumeFileName || 'resume.pdf').slice(0, 255);
      user.resumeUrl = resumeUrl || user.resumeUrl;
    }
    user.name = name;
    user.linkedinProfile = linkedinUrl;
    user.jobTrack = track;
    user.profileReady = true;
    return this.toPublic(await this.userRepository.save(user));
  }

  private skillFromResume(text: string, track: string) {
    if (track === 'frontend') {
      if (text.includes('angular')) return 'Angular';
      if (text.includes('vue')) return 'Vue';
      return 'React';
    }
    if (text.includes('golang') || text.includes(' go ')) return 'Golang';
    if (text.includes('python')) return 'Python';
    if (text.includes('node')) return 'Node.js';
    return 'Java';
  }

  private async ensureProfileColumns() {
    const postgres = this.dataSource.options.type === 'postgres';
    const statements = postgres
      ? [
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_profile varchar(500) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS job_track varchar(20) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS job_skill varchar(40) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url text`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_file_name varchar(255) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_ready boolean NOT NULL DEFAULT false`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS plugin_password_hash varchar(255)`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token varchar(64)`,
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires timestamp`,
        ]
      : [
          `ALTER TABLE users ADD COLUMN linkedin_profile varchar(500) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN job_track varchar(20) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN job_skill varchar(40) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN resume_url text`,
          `ALTER TABLE users ADD COLUMN resume_file_name varchar(255) NOT NULL DEFAULT ''`,
          `ALTER TABLE users ADD COLUMN profile_ready tinyint NOT NULL DEFAULT 0`,
          `ALTER TABLE users ADD COLUMN plugin_password_hash varchar(255) NULL`,
          `ALTER TABLE users ADD COLUMN reset_token varchar(64) NULL`,
          `ALTER TABLE users ADD COLUMN reset_expires datetime NULL`,
        ];
    for (const statement of statements) {
      try { await this.userRepository.query(statement); } catch { /* column already exists */ }
    }
  }

  /**
   * Database Sign Up (Email & Password)
   */
  async register(dto: { email: string; password?: string; name?: string; linkedinUrl?: string }): Promise<User> {
    const linkedinProfile = (dto.linkedinUrl || '').trim();
    const linkedinName = this.nameFromLinkedIn(linkedinProfile);
    const passwordHash = dto.password ? this.hashPassword(dto.password) : undefined;
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      if (passwordHash && existing.passwordHash && existing.pluginPasswordHash) {
        throw new BadRequestException('This email already has both passwords.');
      }
      if (passwordHash) {
        if (!existing.passwordHash) existing.passwordHash = passwordHash;
        else if (!existing.pluginPasswordHash) existing.pluginPasswordHash = passwordHash;
      }
      if (linkedinProfile) existing.linkedinProfile = linkedinProfile;
      if (linkedinName && (!existing.name || existing.name === 'Member')) existing.name = linkedinName;
      return this.userRepository.save(existing);
    }

    const user = this.userRepository.create({
      email: dto.email,
      name: linkedinName || dto.name || 'Member',
      passwordHash,
      linkedinProfile,
      isPro: false,
    });

    return this.userRepository.save(user);
  }

  /**
   * Database Sign In (Email & Password)
   */
  private hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private passwordMatches(stored: string | undefined, password?: string) {
    if (!stored || !password) return false;
    const [salt, storedHash] = stored.split(':');
    if (!salt || !storedHash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return verifyHash === storedHash;
  }

  private nameFromLinkedIn(url?: string) {
    const match = (url || '').match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (!match) return '';
    const words = decodeURIComponent(match[1])
      .split('-')
      .filter((part) => part && !/^\d+$/.test(part));
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  async login(dto: { email: string; password?: string }): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const matches = this.passwordMatches(user.passwordHash, dto.password)
      || this.passwordMatches(user.pluginPasswordHash, dto.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return user;
  }

  async savePluginAccount(dto: { email: string; password: string; linkedinUrl?: string }): Promise<User> {
    const email = (dto.email || '').trim().toLowerCase();
    const password = dto.password || '';
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const linkedinProfile = (dto.linkedinUrl || '').trim();
    const linkedinName = this.nameFromLinkedIn(linkedinProfile);
    let user = await this.userRepository.findOne({ where: { email } });
    if (user && user.passwordHash && user.pluginPasswordHash) {
      throw new BadRequestException('This email already has both passwords.');
    }
    if (!user) {
      user = this.userRepository.create({
        email,
        name: linkedinName || 'Member',
        pluginPasswordHash: this.hashPassword(password),
        linkedinProfile,
        isPro: false,
      });
    } else {
      const nextHash = this.hashPassword(password);
      if (!user.passwordHash) user.passwordHash = nextHash;
      else user.pluginPasswordHash = nextHash;
      if (linkedinProfile) user.linkedinProfile = linkedinProfile;
      if (linkedinName && (!user.name || user.name === 'Member')) user.name = linkedinName;
    }
    return this.userRepository.save(user);
  }

  async forgotPassword(email: string) {
    const normalized = (email || '').trim();
    const user = normalized ? await this.userRepository.findOne({ where: { email: normalized } }) : null;
    if (!user) return { success: true };
    const token = crypto.randomBytes(24).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await this.userRepository.save(user);
    const link = `${this.frontendUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    if (!smtpUser || !smtpPass) {
      throw new BadRequestException('Email is not configured.');
    }
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM || `ProfileReel AI <${smtpUser}>`,
      to: user.email,
      subject: 'Reset your ProfileReel password',
      html: `<p>Hello ${user.name || 'there'},</p><p>Use this link to set a new database password. It expires in 30 minutes.</p><p><a href="${link}">${link}</a></p>`,
    });
    return { success: true };
  }

  async resetPassword(token: string, password: string) {
    if (!token || !password) throw new BadRequestException('Password reset link is invalid.');
    const resetToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findOne({ where: { resetToken } });
    if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
      throw new BadRequestException('This reset link has expired. Ask for a new one.');
    }
    user.passwordHash = this.hashPassword(password);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await this.userRepository.save(user);
    return { success: true };
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  getFrontendUrl(): string {
    return this.frontendUrl;
  }
}

