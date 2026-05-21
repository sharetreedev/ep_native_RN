import { notFound } from 'next/navigation';
import { getAllSlugs, getDocBySlug } from '../../lib/docs';
import { Markdown } from '../../components/Markdown';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function DocPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const doc = getDocBySlug(slug);
  if (!doc) notFound();

  // Strip the leading H1 because the heading is the first thing in the
  // markdown body and rendering it here would double up — we don't have
  // a separate page title element above the article.
  // Actually keep it — the layout doesn't render a separate title, the
  // H1 in the markdown IS the page title. So just render as-is.
  return <Markdown content={doc.content} />;
}
