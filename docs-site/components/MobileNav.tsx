'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { NavGroup } from '../lib/docs';

interface MobileNavProps {
  nav: NavGroup[];
}

export function MobileNav({ nav }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-ink-muted hover:bg-sand-light hover:text-ink transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-sand-light shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-sand-dark/40">
              <span className="font-heading font-bold text-lg text-ink">
                Pulse Docs
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-md flex items-center justify-center text-ink-muted hover:bg-sand hover:text-ink"
                aria-label="Close navigation"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <Sidebar nav={nav} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
