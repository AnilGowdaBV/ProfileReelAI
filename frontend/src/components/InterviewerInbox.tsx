import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../services/api';

function seenKey(email: string) {
  return `profilereel_seen_notices:${email.trim().toLowerCase()}`;
}

function readSeen(email: string): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenKey(email)) || '{}') as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function stamp(row: { id: string; status: string; interviewDate?: string; interviewTime?: string; meetLink?: string }) {
  return [row.status || 'REQUESTED', row.interviewDate || '', row.interviewTime || '', row.meetLink || ''].join('|');
}

export function unseenNoticeCount(email: string, rows: Array<{ id: string; status: string; interviewDate?: string; interviewTime?: string; meetLink?: string }>) {
  const seen = readSeen(email);
  return rows.filter((row) => seen[row.id] !== stamp(row)).length;
}

export function markNoticesSeen(email: string, rows: Array<{ id: string; status: string; interviewDate?: string; interviewTime?: string; meetLink?: string }>) {
  const seen = readSeen(email);
  rows.forEach((row) => {
    seen[row.id] = stamp(row);
  });
  localStorage.setItem(seenKey(email), JSON.stringify(seen));
}

export const InterviewerInbox: React.FC<{ email?: string }> = ({ email }) => {
  const navigate = useNavigate();
  const [approved, setApproved] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!email) return;
    api.interviewerInbox(email)
      .then(async (result) => {
        if (result.approved) {
          setApproved(true);
          setCount(unseenNoticeCount(email, result.requests || []));
          return;
        }
        const mine = await api.myInterviewRequests(email).catch(() => []);
        setApproved(false);
        setCount(unseenNoticeCount(email, mine));
      })
      .catch(() => {
        setApproved(false);
        setCount(0);
      });
  }, [email]);

  if (!email) return null;

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => navigate(approved ? '/notifications' : '/my-requests')}
          className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">
              {count}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
