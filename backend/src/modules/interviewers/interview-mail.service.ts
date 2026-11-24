import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type InterviewMailKind = 'scheduled' | 'rescheduled' | 'reminder';

export interface InterviewMailDetails {
  kind: InterviewMailKind;
  candidateName: string;
  candidateEmail: string;
  interviewerName: string;
  interviewerEmail: string;
  jobTitle: string;
  companyName: string;
  date: string;
  time: string;
  meetLink: string;
  note?: string;
}

export function meetingStart(date: string, time: string): Date | null {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || '0');
  const period = (match[3] || '').toLowerCase();
  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  const stamp = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`;
  const parsed = new Date(stamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

@Injectable()
export class InterviewMailService {
  private readonly logger = new Logger(InterviewMailService.name);

  async sendPair(details: InterviewMailDetails) {
    await Promise.all([
      this.sendOne(details, 'candidate'),
      this.sendOne(details, 'interviewer'),
    ]);
  }

  private async sendOne(details: InterviewMailDetails, who: 'candidate' | 'interviewer') {
    const to = who === 'candidate' ? details.candidateEmail : details.interviewerEmail;
    if (!to) return;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    if (!user || !pass) {
      this.logger.warn('SMTP is not configured. Interview email was not sent.');
      return;
    }
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
    const hello = who === 'candidate' ? details.candidateName : details.interviewerName;
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM || `ProfileReel Interviews <${user}>`,
        to,
        subject: this.subject(details, who),
        html: this.html(details, who, hello),
      });
      this.logger.log(`Sent ${details.kind} interview email to ${who}`);
    } catch (error) {
      this.logger.warn(`Interview email failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private subject(details: InterviewMailDetails, who: 'candidate' | 'interviewer') {
    if (details.kind === 'reminder') return `Your interview starts in 10 minutes`;
    if (details.kind === 'rescheduled') return `Interview rescheduled to ${this.when(details)}`;
    return who === 'interviewer'
      ? `${details.candidateName} requested an interview with you`
      : `Your interview with ${details.interviewerName} is booked`;
  }

  private when(details: InterviewMailDetails) {
    const parsed = meetingStart(details.date, details.time);
    if (!parsed) return `${details.date} ${details.time}`.trim();
    return parsed.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }

  private html(details: InterviewMailDetails, who: 'candidate' | 'interviewer', hello: string) {
    const banner = details.kind === 'rescheduled'
      ? 'This interview has a new time'
      : details.kind === 'reminder'
        ? 'This interview starts in 10 minutes'
        : who === 'interviewer'
          ? `${esc(details.candidateName)} requested this interview with you`
          : `You requested this interview with ${esc(details.interviewerName)}`;
    const lead = details.kind === 'rescheduled'
      ? `Hi ${esc(hello)}, the interview time has changed. The new time is highlighted below.`
      : details.kind === 'reminder'
        ? `Hi ${esc(hello)}, this is a reminder from ProfileReel. Please join a few minutes early.`
        : who === 'interviewer'
          ? `Hi ${esc(details.interviewerName)}, ${esc(details.candidateName)} requested a meeting with you for ${esc(details.jobTitle)} at ${esc(details.companyName)}.`
          : `Hi ${esc(details.candidateName)}, your request to interview with ${esc(details.interviewerName)} is booked.`;
    const timeBox = details.kind === 'rescheduled'
      ? `<div style="margin:18px 0;padding:14px 16px;border-radius:14px;background:#fff7ed;border:1px solid #fdba74;"><div style="font-size:12px;font-weight:700;letter-spacing:.04em;color:#c2410c;">RESCHEDULED TIME</div><div style="margin-top:4px;font-size:18px;font-weight:800;color:#9a3412;">${esc(this.when(details))}</div></div>`
      : `<div style="margin:18px 0;padding:14px 16px;border-radius:14px;background:#f5f3ff;border:1px solid #ddd6fe;"><div style="font-size:12px;font-weight:700;letter-spacing:.04em;color:#6d28d9;">INTERVIEW TIME</div><div style="margin-top:4px;font-size:18px;font-weight:800;color:#4c1d95;">${esc(this.when(details))}</div></div>`;
    const link = details.meetLink
      ? `<a href="${esc(details.meetLink)}" style="display:inline-block;margin-top:8px;background:#6d28d9;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px;">Join Google Meet</a><p style="margin:10px 0 0;font-size:12px;color:#64748b;">${esc(details.meetLink)}</p>`
      : `<p style="color:#64748b;">The Meet link will appear once the meeting is ready.</p>`;
    const note = details.note ? `<p style="margin:16px 0 0;color:#334155;"><strong>Note:</strong> ${esc(details.note)}</p>` : '';
    return `<!doctype html><html><body style="margin:0;background:#f4f0ff;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ede9fe;">
        <div style="background:#6d28d9;color:#ffffff;padding:22px 24px;">
          <div style="font-size:13px;letter-spacing:.08em;font-weight:700;">PROFILEREEL</div>
          <div style="margin-top:6px;font-size:22px;font-weight:800;">${banner}</div>
        </div>
        <div style="padding:22px 24px;">
          <p style="margin:0;font-size:15px;line-height:1.6;">${lead}</p>
          ${timeBox}
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;">Candidate</td><td style="padding:8px 0;font-weight:700;">${esc(details.candidateName)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Interviewer</td><td style="padding:8px 0;font-weight:700;">${esc(details.interviewerName)}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Role</td><td style="padding:8px 0;font-weight:700;">${esc(details.jobTitle)} · ${esc(details.companyName)}</td></tr>
          </table>
          ${note}
          <div style="margin-top:18px;">${link}</div>
        </div>
      </div>
    </body></html>`;
  }
}

function esc(value: string) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}
