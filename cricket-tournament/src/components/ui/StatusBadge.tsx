import { STATUS_LABELS } from '@/lib/cricket';

const COLORS: Record<string, string> = {
  UPCOMING: 'bg-slate-100 text-slate-700 border-slate-300',
  REGISTRATION_OPEN: 'bg-[color:var(--color-gold-300)] text-navy-900 border-[color:var(--color-gold-500)]',
  LIVE: 'bg-[color:var(--color-red-600)] text-white border-[color:var(--color-red-600)]',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-300',
  CANCELLED: 'bg-slate-200 text-slate-500 border-slate-300',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? 'bg-slate-100 text-slate-700 border-slate-300';
  const isLive = status === 'LIVE';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${cls}`}
    >
      {isLive && <span className="live-pulse h-2 w-2 rounded-full bg-white" />}
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
