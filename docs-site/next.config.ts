import type { NextConfig } from 'next';

const config: NextConfig = {
  // Markdown is read from ../docs at build time (see lib/docs.ts).
  // Force static export so Vercel just serves prebuilt HTML.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default config;
