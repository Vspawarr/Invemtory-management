export default function StatCard({
  label,
  value,
  accent = 'navy',
  hint,
}: {
  label: string;
  value: string | number;
  accent?: 'navy' | 'gold' | 'red' | 'emerald';
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    navy: 'border-navy-900',
    gold: 'border-[color:var(--color-gold-500)]',
    red: 'border-[color:var(--color-red-600)]',
    emerald: 'border-emerald-500',
  };
  return (
    <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${accentClasses[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-navy-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
