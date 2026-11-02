import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {
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

  /**
   * Database Sign Up (Email & Password)
   */
  async register(dto: { email: string; password?: string; name?: string }): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(dto.password, salt, 1000, 64, 'sha512').toString('hex');
      passwordHash = `${salt}:${hash}`;
    }

    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name || 'Member',
      passwordHash,
      isPro: false,
    });

    return this.userRepository.save(user);
  }

  /**
   * Database Sign In (Email & Password)
   */
  async login(dto: { email: string; password?: string }): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.passwordHash && dto.password) {
      const [salt, storedHash] = user.passwordHash.split(':');
      const verifyHash = crypto.pbkdf2Sync(dto.password, salt, 1000, 64, 'sha512').toString('hex');
      if (verifyHash !== storedHash) {
        throw new UnauthorizedException('Invalid email or password.');
      }
    }

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  getFrontendUrl(): string {
    return this.frontendUrl;
  }
}

