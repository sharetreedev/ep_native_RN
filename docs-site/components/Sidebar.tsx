'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import type { NavGroup } from '../lib/docs';

interface SidebarProps {
  nav: NavGroup[];
  onNavigate?: () => void;
}

export function Sidebar({ nav, onNavigate }: SidebarProps) {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="flex flex-col gap-7 py-2 text-sm">
      <Link
        href="/"
        onClick={onNavigate}
        className={clsx(
          'flex items-baseline gap-2 px-3 py-2 rounded-lg transition-colors',
          pathname === '/' || pathname === ''
            ? 'bg-meadow-tint text-meadow-darker font-semibold'
            : 'text-ink-muted hover:text-ink hover:bg-sand-light',
        )}
      >
        <span className="font-heading text-base">Overview</span>
      </Link>

      {nav.map((group) => (
        <div key={group.label}>
          <h3 className="px-3 mb-2 font-heading text-[0.7rem] uppercase tracking-[0.12em] text-ink-subtle">
            {group.label}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const href = '/' + item.slug.join('/') + '/';
              const isActive = pathname === href || pathname === href.replace(/\/$/, '');
              const displayTitle = item.title
                .replace(/^Runbook\s*—\s*/, '')
                .replace(/^Pulse 4\.0\s*[—-]\s*/, '');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={clsx(
                      'block px-3 py-1.5 rounded-md transition-colors',
                      isActive
                        ? 'bg-meadow-tint text-meadow-darker font-semibold'
                        : 'text-ink-muted hover:text-ink hover:bg-sand-light',
                    )}
                  >
                    {displayTitle}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
