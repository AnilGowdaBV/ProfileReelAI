import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

const ORGANIZER = (process.env.GOOGLE_MEET_ORGANIZER || 'kulkarni.karthik@thinkify.io').trim().toLowerCase();

@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);

  constructor(private readonly dataSource: DataSource) {}

  connectUrl() {
    const clientId = process.env.GOOGLE_MEET_CLIENT_ID || '';
    if (!clientId) {
      throw new BadRequestException('Set GOOGLE_MEET_CLIENT_ID and GOOGLE_MEET_CLIENT_SECRET before connecting the company Google account.');
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      login_hint: ORGANIZER,
      scope: [
        'openid',
        'email',
        'https://www.googleapis.com/auth/meetings.space.created',
        'https://www.googleapis.com/auth/meetings.space.settings',
        'https://www.googleapis.com/auth/meetings.space.readonly',
      ].join(' '),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async saveAuthorization(code: string) {
    const token = await this.tokenRequest({
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri(),
    });
    const email = await this.accountEmail(token.access_token);
    if (email !== ORGANIZER) {
      throw new BadRequestException(`Sign in as ${ORGANIZER}. ${email || 'That account'} cannot be the meeting organizer.`);
    }
    if (!token.refresh_token) {
      throw new BadRequestException('Google did not return a refresh token. Open the connect link again and accept every permission.');
    }
    await this.dataSource.query(
      `INSERT INTO google_meet_organizer (id, email, refresh_token)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), refresh_token = VALUES(refresh_token)`,
      [email, token.refresh_token],
    );
    return email;
  }

  async recordingsFor(spaceName: string) {
    if (!spaceName) return [];
    const accessToken = await this.accessToken();
    const filter = encodeURIComponent(`space.name = "${spaceName}"`);
    const recordsResponse = await fetch(`https://meet.googleapis.com/v2/conferenceRecords?filter=${filter}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const recordsBody = await recordsResponse.json().catch(() => ({}));
    if (recordsResponse.status === 403) {
      throw new BadRequestException('Reconnect the company Google account so recordings can be read.');
    }
    if (!recordsResponse.ok) {
      throw new BadRequestException(recordsBody?.error?.message || 'Google Meet could not list recordings.');
    }
    const records = Array.isArray(recordsBody.conferenceRecords) ? recordsBody.conferenceRecords : [];
    const found: Array<{ state: string; watchUrl: string; startedAt: string; endedAt: string }> = [];
    for (const record of records) {
      const recordingsResponse = await fetch(`https://meet.googleapis.com/v2/${record.name}/recordings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const recordingsBody = await recordingsResponse.json().catch(() => ({}));
      if (!recordingsResponse.ok) continue;
      const recordings = Array.isArray(recordingsBody.recordings) ? recordingsBody.recordings : [];
      for (const recording of recordings) {
        found.push({
          state: String(recording.state || 'PENDING'),
          watchUrl: String(recording.driveDestination?.exportUri || ''),
          startedAt: String(recording.startTime || record.startTime || ''),
          endedAt: String(recording.endTime || ''),
        });
      }
    }
    return found;
  }

  async createMeeting() {
    const accessToken = await this.accessToken();
    const response = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          accessType: 'OPEN',
          entryPointAccess: 'ALL',
          artifactConfig: {
            recordingConfig: { autoRecordingGeneration: 'ON' },
          },
        },
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || 'Google Meet could not create this meeting.';
      this.logger.warn(`Meet space create failed: ${message}`);
      throw new BadRequestException(message);
    }
    const armed = body?.config?.artifactConfig?.recordingConfig?.autoRecordingGeneration === 'ON';
    if (!armed) {
      throw new BadRequestException('Google created no auto-record setting for this account. Recording must be allowed on the company Workspace plan.');
    }
    return {
      meetLink: String(body.meetingUri || ''),
      meetSpace: String(body.name || ''),
    };
  }

  private async accessToken() {
    const rows = await this.dataSource.query(`SELECT refresh_token FROM google_meet_organizer WHERE id = 1`);
    const refreshToken = rows?.[0]?.refresh_token;
    if (!refreshToken) {
      throw new BadRequestException(`Connect ${ORGANIZER} once at /api/interviewers/google/connect before scheduling.`);
    }
    const token = await this.tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return token.access_token;
  }

  private async tokenRequest(fields: Record<string, string>) {
    const clientId = process.env.GOOGLE_MEET_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_MEET_CLIENT_SECRET || '';
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Set GOOGLE_MEET_CLIENT_ID and GOOGLE_MEET_CLIENT_SECRET before connecting the company Google account.');
    }
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...fields }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) {
      throw new BadRequestException(body?.error_description || 'Google did not accept the company account.');
    }
    return body as { access_token: string; refresh_token?: string };
  }

  private async accountEmail(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json().catch(() => ({}));
    return String(body.email || '').trim().toLowerCase();
  }

  private redirectUri() {
    return process.env.GOOGLE_MEET_REDIRECT_URI || 'http://localhost:3000/api/interviewers/google/callback';
  }
}
