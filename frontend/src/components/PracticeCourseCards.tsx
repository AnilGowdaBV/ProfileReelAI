import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api, type CoursePlatformRow } from '../services/api';
import { SectionSpinner } from './SectionSpinner';

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

const FIT: Record<string, string[]> = {
  react: ['react', 'frontend', 'front-end', 'front end', 'full-stack', 'fullstack', 'full stack', 'ui'],
  java: ['java', 'dsa', 'lld'],
  golang: ['go', 'golang', 'backend', 'system'],
  dataengineer: ['data engineer', 'pipeline', 'etl', 'spark', 'warehouse'],
  sdet: ['sdet', 'playwright', 'testing', 'qa', 'automation'],
  dataanalyst: ['data analyst', 'analytics', 'sql', 'excel', 'tableau'],
  devops: ['devops', 'cloud', 'infra', 'kubernetes', 'ci'],
};

function fitsRole(course: CoursePlatformRow, roles: string[]) {
  const tagged = (course.recommendFor || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (tagged.length > 0) return tagged.some((tag) => roles.includes(tag));
  const key = course.purpose.toLowerCase();
  if (!key.trim() || roles.length === 0) return false;
  return roles.some((role) => (FIT[role] || []).some((word) => key.includes(word)));
}

export const PracticeCourseCards: React.FC<{ heading?: string; kicker?: string; roles?: string[]; onSelect?: () => void; compact?: boolean }> = ({
  heading = 'Recommended for you',
  kicker,
  roles = [],
  onSelect,
  compact = false,
}) => {
  const [courses, setCourses] = useState<CoursePlatformRow[]>([]);
  const [deck, setDeck] = useState<CoursePlatformRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.coursePlatforms()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const picked = courses.filter((course) => fitsRole(course, roles));
  const pool = picked.length > 0 ? picked : courses;

  useEffect(() => {
    const next = [...pool];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      const current = next[index];
      next[index] = next[swap];
      next[swap] = current;
    }
    setDeck(next);
  }, [courses, roles.join('|')]);

  useEffect(() => {
    if (deck.length <= 3) return undefined;
    const timer = window.setInterval(() => {
      setDeck((current) => [...current.slice(3), ...current.slice(0, 3)]);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [deck.length]);

  if (loading) {
    return <SectionSpinner compact label="Loading platforms" />;
  }

  const shown = deck.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <div>
      {(kicker || heading) && (
        <div className="text-center">
          {kicker && <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600">{kicker}</p>}
          {heading && <h3 className={compact ? 'text-sm font-black text-slate-950' : 'text-lg font-black text-slate-900'}>{heading}</h3>}
        </div>
      )}
      <div className={compact ? 'mt-1.5 grid grid-cols-3 gap-2' : 'mt-4 grid grid-cols-1 gap-4 md:grid-cols-3'}>
        {shown.map((course) => {
          const host = hostOf(course.url);
          return (
            <a
              key={course.id}
              href={onSelect ? undefined : course.url}
              target={onSelect ? undefined : '_blank'}
              rel="noreferrer"
              onClick={onSelect ? (event) => { event.preventDefault(); onSelect(); } : undefined}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm"
            >
              <span className={`flex items-center justify-center border-b border-slate-100 bg-slate-50 ${compact ? 'h-8' : 'h-14'}`}>
                <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=128`} alt="" className={`rounded-lg border border-slate-200 bg-white object-contain ${compact ? 'h-5 w-5' : 'h-9 w-9 rounded-xl p-1'}`} />
              </span>
              <span className={`flex flex-1 flex-col ${compact ? 'px-2.5 py-1.5' : 'px-4 py-3'}`}>
                <span className="flex items-start justify-between gap-2">
                  <span className={`font-bold text-slate-900 ${compact ? 'line-clamp-1 text-xs' : 'text-base'}`}>{course.name}</span>
                  {course.purpose && (
                    <span className="shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">{course.purpose}</span>
                  )}
                </span>
                {!compact && <span className="mt-2 text-xs text-slate-500">{host}</span>}
                <span className={`flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 font-bold text-white ${compact ? 'mt-1.5 py-1 text-[11px]' : 'mt-3 py-2 text-xs'}`}>
                  Start learning
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
