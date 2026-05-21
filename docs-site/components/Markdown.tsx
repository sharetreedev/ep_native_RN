import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Link from 'next/link';

interface MarkdownProps {
  content: string;
}

/**
 * Rewrites markdown links so they work in the docs site:
 *  - `./01-quickstart.md`  →  `/01-quickstart/`
 *  - `./runbooks/foo.md`   →  `/runbooks/foo/`
 *  - `../src/api/client.ts` → GitHub blob link (best effort; we don't know the repo URL at build time, so render as code instead)
 *
 * Anything else is left as-is.
 */
function rewriteHref(href: string): string {
  if (!href) return href;
  if (/^(https?:|mailto:|#)/.test(href)) return href;

  // Strip .md / .mdx and trailing slashes
  let url = href.replace(/\.mdx?$/, '');
  if (url.startsWith('./')) url = url.slice(2);
  if (url === 'README') url = '';
  if (url.startsWith('README#')) url = url.replace('README', '');

  // External-ish: anything pointing outside the /docs tree (../src/..) becomes
  // a passive code-style reference in the renderer (handled below).
  if (url.startsWith('../')) return href; // keep raw for the link component to detect

  // Internal: prepend slash, ensure trailing slash for static export
  if (!url.startsWith('/')) url = '/' + url;
  if (!url.endsWith('/') && !url.includes('#')) url = url + '/';
  return url;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['heading-anchor'], 'aria-hidden': 'true' },
            content: { type: 'text', value: '#' },
          },
        ],
        [rehypeHighlight, { detect: true, ignoreMissing: true }],
      ]}
      components={{
        a({ href, children, ...rest }) {
          const target = href ?? '';
          const isExternal = /^https?:/.test(target);
          const isRepoSource = target.startsWith('../');

          if (isExternal) {
            return (
              <a href={target} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            );
          }

          if (isRepoSource) {
            // Reference to a source file in the main repo (e.g. ../src/api/client.ts).
            // Render as monospace, no link — readers can find it in the repo themselves.
            return (
              <code className="not-prose">
                {Array.isArray(children) ? children.join('') : children}
              </code>
            );
          }

          const rewritten = rewriteHref(target);
          return (
            <Link href={rewritten} {...rest}>
              {children}
            </Link>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
