import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api, type CoursePlatformRow } from '../services/api';
import { SectionSpinner } from './SectionSpinner';

const LOOKS = [
  { wash: '#f5f3ff', accent: '#7c3aed', ink: '#4c1d95' },
  { wash: '#ecfeff', accent: '#0891b2', ink: '#155e75' },
  { wash: '#fff7ed', accent: '#ea580c', ink: '#9a3412' },
  { wash: '#ecfdf5', accent: '#059669', ink: '#065f46' },
  { wash: '#fdf2f8', accent: '#db2777', ink: '#9d174d' },
];

function lookFor(purpose: string, index: number) {
  const key = purpose.toLowerCase();
  if (key.includes('dsa')) return { wash: '#f5f3ff', accent: '#7c3aed', ink: '#4c1d95' };
  if (key.includes('system') || key.includes('ai')) return { wash: '#eff6ff', accent: '#2563eb', ink: '#1e40af' };
  if (key.includes('lld')) return { wash: '#fff7ed', accent: '#ea580c', ink: '#9a3412' };
  if (key.includes('full') || key.includes('stack')) return { wash: '#ecfdf5', accent: '#059669', ink: '#065f46' };
  return LOOKS[index % LOOKS.length];
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

const Favicon: React.FC<{ host: string; name: string }> = ({ host, name }) => {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-[10px] font-black text-slate-700">
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      onError={() => setBroken(true)}
      className="h-8 w-8 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
    />
  );
};

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

export const PracticeCourseCards: React.FC<{ heading?: string; kicker?: string; roles?: string[] }> = ({
  heading = 'Recommended for you',
  kicker,
  roles = [],
}) => {
  const [courses, setCourses] = useState<CoursePlatformRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.coursePlatforms()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const picked = courses.filter((course) => fitsRole(course, roles));

  if (loading) {
    return <SectionSpinner compact label="Loading platforms" />;
  }

  if (picked.length === 0) return null;

  return (
    <div>
      {(kicker || heading) && (
        <div className="mb-3.5">
          {kicker && <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600">{kicker}</p>}
          {heading && <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">{heading}</h3>}
        </div>
      )}
      <div className="flex flex-wrap gap-2.5">
        {picked.map((course, index) => {
          const look = lookFor(course.purpose, index);
          const host = hostOf(course.url);
          return (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noreferrer"
              className="group relative flex h-[132px] w-[200px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 p-3 text-left shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
              style={{ background: `linear-gradient(180deg, #ffffff 0%, ${look.wash} 100%)` }}
            >
              <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: look.accent }} />
              <span className="relative flex items-start justify-between gap-1.5">
                <Favicon host={host} name={course.name} />
                {course.purpose && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase leading-tight tracking-[0.08em]"
                    style={{ background: `${look.accent}14`, color: look.ink }}
                  >
                    {course.purpose}
                  </span>
                )}
              </span>
              <span className="relative mt-auto min-w-0">
                <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{host}</span>
                <span className="mt-0.5 block truncate text-[13px] font-black leading-tight text-slate-900">{course.name}</span>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color: look.ink }}>
                  Start learning
                  <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
