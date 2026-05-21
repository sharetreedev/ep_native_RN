import type { Metadata } from 'next';
import { Manrope, Quicksand, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getNavigation } from '../lib/docs';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pulse 4.0 — Developer Docs',
  description:
    'Developer documentation for the Sharetree Emotional Pulse mobile app — quickstart, architecture, environments, runbooks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = getNavigation();

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${quicksand.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-sand-dark/40 bg-[#FAF8F4]/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileNav nav={nav} />
              <Link
                href="/"
                className="flex items-baseline gap-2 group"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-meadow text-white font-heading font-bold text-sm tracking-tight">
                  P
                </span>
                <span className="font-heading text-lg font-semibold text-ink leading-none">
                  Pulse 4.0
                </span>
                <span className="text-ink-subtle text-sm font-body hidden sm:inline">
                  · Developer docs
                </span>
              </Link>
            </div>

            <a
              href="https://github.com/sharetreedev/ep_native_RN"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
            >
              GitHub
              <ExternalLink size={14} strokeWidth={2} />
            </a>
          </div>
        </header>

        <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-10">
            <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0 py-10">
              <div className="sticky top-24">
                <Sidebar nav={nav} />
              </div>
            </aside>

            <main className="flex-1 min-w-0 py-10">
              <article className="prose-pulse max-w-3xl">{children}</article>
            </main>
          </div>
        </div>

        <footer className="border-t border-sand-dark/40 py-6 text-center text-xs text-ink-subtle">
          Sharetree · Emotional Pulse Mobile · Built for handing off
        </footer>
      </body>
    </html>
  );
}
