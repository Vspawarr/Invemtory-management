'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/players', label: 'Players', icon: '👤' },
  { href: '/admin/teams', label: 'Teams / Pairs', icon: '🤝' },
  { href: '/admin/registrations', label: 'Registrations', icon: '📝' },
  { href: '/admin/payments', label: 'Payments', icon: '💰' },
  { href: '/admin/matches', label: 'Matches', icon: '🗓️' },
  { href: '/admin/live-scoring', label: 'Live Scoring', icon: '🏏' },
  { href: '/admin/results', label: 'Results', icon: '🏁' },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/admin/statistics', label: 'Statistics', icon: '📈' },
  { href: '/admin/settings', label: 'Tournament Settings', icon: '⚙️' },
  { href: '/admin/rules', label: 'Rules', icon: '📋' },
  { href: '/admin/reports', label: 'Reports', icon: '📤' },
  { href: '/admin/admins', label: 'Admins', icon: '🔑' },
];

export default function AdminNav({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {NAV_ITEMS.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active ? 'bg-gold-500 text-navy-900' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
