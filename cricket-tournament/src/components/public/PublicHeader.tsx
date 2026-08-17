import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/teams', label: 'Teams' },
  { href: '/players', label: 'Players' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/stats', label: 'Stats' },
  { href: '/rules', label: 'Rules' },
];

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 bg-navy-900 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-500 text-lg font-black text-navy-900">
            🏏
          </span>
          <span className="truncate text-sm font-bold leading-tight sm:text-base">
            Shivsankalp Yuva Pratishthan
            <span className="block text-[11px] font-medium text-gold-300 sm:text-xs">
              Cricket Tournament
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-white/85 hover:text-gold-400">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-1.5 text-xs font-semibold sm:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 rounded-full px-3 py-1.5 text-white/85 hover:bg-white/10 hover:text-gold-400"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
