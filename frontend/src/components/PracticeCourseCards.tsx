import React from 'react';
import { PRACTICE_COURSES } from '../data/practiceCourses';

export const PracticeCourseCards: React.FC<{ heading?: string }> = ({ heading = 'Recommended for you' }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">{heading}</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {PRACTICE_COURSES.map((course) => (
        <a
          key={course.title}
          href={course.url}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-charcoal-900"
        >
          <span className={`h-1.5 bg-gradient-to-r ${course.tint}`} />
          <span className="flex flex-1 flex-col p-4">
            <span className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{course.provider}</span>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">{course.level}</span>
            </span>
            <span className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">{course.title}</span>
            <span className="mt-1 flex-1 text-xs leading-5 text-slate-500">{course.blurb}</span>
            <span className="mt-3 text-xs font-bold text-violet-700 group-hover:underline">Open course</span>
          </span>
        </a>
      ))}
    </div>
  </div>
);
