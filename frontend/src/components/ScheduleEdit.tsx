import React, { useState } from 'react';

export const ScheduleEdit: React.FC<{
  title: string;
  date: string;
  time: string;
  meetLink: string;
  note: string;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (value: { date: string; time: string; meetLink: string; note: string }) => void;
}> = ({ title, date, time, meetLink, note, busy, error, onClose, onSave }) => {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const [nextDate, setNextDate] = useState(date);
  const [hour, setHour] = useState(match ? match[1].padStart(2, '0') : '10');
  const [minute, setMinute] = useState(match ? match[2] : '00');
  const [period, setPeriod] = useState<'AM' | 'PM'>(match && match[3].toUpperCase() === 'PM' ? 'PM' : 'AM');
  const [link, setLink] = useState(meetLink);
  const [nextNote, setNextNote] = useState(note);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ date: nextDate, time: `${hour}:${minute} ${period}`, meetLink: link.trim(), note: nextNote.trim() });
        }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Reschedule</p>
        <h2 className="mt-1 text-xl font-black">{title}</h2>
        <label className="mt-4 block text-xs font-bold text-slate-600">Date
          <input required type="date" value={nextDate} onChange={(event) => setNextDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="mt-3 block text-xs font-bold text-slate-600">Time
          <span className="mt-1 flex gap-2">
            <select value={hour} onChange={(event) => setHour(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={minute} onChange={(event) => setMinute(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {['00', '15', '30', '45'].map((value) => <option key={value}>{value}</option>)}
            </select>
            <select value={period} onChange={(event) => setPeriod(event.target.value as 'AM' | 'PM')} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
              <option>AM</option>
              <option>PM</option>
            </select>
          </span>
        </label>
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{link ? 'The Google Meet link stays the same.' : 'A Google Meet link will be created if this interview does not have one yet.'}</p>
        <label className="mt-3 block text-xs font-bold text-slate-600">Note
          <textarea value={nextNote} onChange={(event) => setNextNote(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{busy ? 'Saving...' : 'Save schedule'}</button>
        </div>
      </form>
    </div>
  );
};
