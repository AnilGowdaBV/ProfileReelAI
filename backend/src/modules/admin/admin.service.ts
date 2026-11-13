import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class AdminService {
  login(username: string, password: string) {
    const expectedUser = process.env.ADMIN_USERNAME || '';
    const expectedPassword = process.env.ADMIN_PASSWORD || '';
    if (!expectedUser || !expectedPassword) {
      throw new UnauthorizedException('Admin login is not configured.');
    }
    const userOk = this.same(username.trim(), expectedUser);
    const passOk = this.same(password, expectedPassword);
    if (!userOk || !passOk) {
      throw new UnauthorizedException('Wrong username or password.');
    }
    return { token: this.token(expectedUser, expectedPassword), username: expectedUser };
  }

  session(header?: string) {
    const expectedUser = process.env.ADMIN_USERNAME || '';
    const expectedPassword = process.env.ADMIN_PASSWORD || '';
    const given = (header || '').replace(/^Bearer\s+/i, '').trim();
    if (!given || !this.same(given, this.token(expectedUser, expectedPassword))) {
      throw new UnauthorizedException('Admin session expired.');
    }
    return { username: expectedUser };
  }

  private token(username: string, password: string) {
    return createHmac('sha256', password).update(username).digest('hex');
  }

  private same(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
