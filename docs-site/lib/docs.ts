import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const DOCS_ROOT = path.resolve(process.cwd(), '..', 'docs');

export interface DocFile {
  /** URL slug array — e.g. ['runbooks', 'push-ota'] or ['01-quickstart'] or [] for the index */
  slug: string[];
  /** Display title pulled from the first H1 in the markdown */
  title: string;
  /** Raw markdown content with frontmatter stripped */
  content: string;
  /** Frontmatter as a plain object */
  frontmatter: Record<string, unknown>;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  slug: string[];
  title: string;
}

function walk(dir: string, base: string[] = []): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = [...base, entry.name];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, rel));
    } else if (entry.name.endsWith('.md')) {
      out.push(rel.join('/'));
    }
  }
  return out;
}

function readDoc(relPath: string): DocFile {
  const full = path.join(DOCS_ROOT, relPath);
  const raw = fs.readFileSync(full, 'utf8');
  const { data, content } = matter(raw);
  const title = extractTitle(content) ?? deriveTitleFromSlug(relPath);
  const slug = slugFromPath(relPath);
  return {
    slug,
    title,
    content,
    frontmatter: data,
  };
}

function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function deriveTitleFromSlug(relPath: string): string {
  const base = path.basename(relPath, '.md');
  return base
    .replace(/^\d+-/, '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function slugFromPath(relPath: string): string[] {
  // 'README.md' -> [] (index)
  // '01-quickstart.md' -> ['01-quickstart']
  // 'runbooks/push-ota.md' -> ['runbooks', 'push-ota']
  const noExt = relPath.replace(/\.md$/, '');
  if (noExt === 'README') return [];
  return noExt.split('/');
}

let _allDocsCache: DocFile[] | null = null;

export function getAllDocs(): DocFile[] {
  if (_allDocsCache) return _allDocsCache;
  // Only include top-level .md files and the runbooks/ folder — skip
  // adjacent design assets (audits/, prototypes/, SCREEN_README_TEMPLATE.md).
  const allFiles = walk(DOCS_ROOT);
  const filtered = allFiles.filter((rel) => {
    if (rel === 'SCREEN_README_TEMPLATE.md') return false;
    if (rel.startsWith('audits/')) return false;
    if (rel.startsWith('prototypes/')) return false;
    return true;
  });
  _allDocsCache = filtered.map(readDoc);
  return _allDocsCache;
}

export function getDocBySlug(slug: string[]): DocFile | null {
  const docs = getAllDocs();
  const target = slug.join('/');
  return (
    docs.find((d) => d.slug.join('/') === target) ?? null
  );
}

export function getAllSlugs(): string[][] {
  return getAllDocs().map((d) => d.slug);
}

/** Ordered navigation groups for the sidebar. */
export function getNavigation(): NavGroup[] {
  const docs = getAllDocs();
  const byTopLevel = (n: number) =>
    docs.filter((d) => d.slug.length === 1 && d.slug[0].startsWith(`0${n}-`));

  const findOne = (name: string) =>
    docs.find((d) => d.slug.length === 1 && d.slug[0] === name);

  const runbookOrder = [
    'push-ota',
    'create-linear-issue',
    'write-release-notes',
    'troubleshoot-builds',
    'rollback-ota',
  ];
  const runbookItems: NavItem[] = runbookOrder
    .map((name) => docs.find((d) => d.slug.join('/') === `runbooks/${name}`))
    .filter((d): d is DocFile => Boolean(d))
    .map((d) => ({ slug: d.slug, title: d.title }));

  const topOrder = ['01-quickstart', '02-architecture', '03-environments', '04-services', '05-releases', '06-ai-handoff', '07-prompting-agents'];
  const topItems: NavItem[] = topOrder
    .map((name) => findOne(name))
    .filter((d): d is DocFile => Boolean(d))
    .map((d) => ({ slug: d.slug, title: d.title }));

  // Suppress unused-warning lint for helper retained for future grouping
  void byTopLevel;

  return [
    { label: 'Get started', items: topItems },
    { label: 'Runbooks', items: runbookItems },
  ];
}
