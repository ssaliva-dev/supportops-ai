const SUPPORTOPS_DOCS_HOST = "docs.supportopsai.dev";
const SOURCE_DOCS_PREFIX = "/source-docs";

function normalizePath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, "");
  return trimmed || "/";
}

function isSupportOpsDocsHost(hostname: string): boolean {
  return hostname.toLowerCase() === SUPPORTOPS_DOCS_HOST;
}

export function toSourceDocumentHref(sourceUrl: string): string {
  const raw = sourceUrl.trim();
  const withoutTrailingPunctuation = raw.replace(/[),.;!?]+$/, "");
  const normalizedCandidate =
    /^https?:\/\//i.test(withoutTrailingPunctuation)
      ? withoutTrailingPunctuation
      : `https://${withoutTrailingPunctuation}`;

  try {
    const parsed = new URL(normalizedCandidate);
    if (isSupportOpsDocsHost(parsed.hostname)) {
      return `${SOURCE_DOCS_PREFIX}${normalizePath(parsed.pathname)}`;
    }
    return withoutTrailingPunctuation;
  } catch {
    return withoutTrailingPunctuation;
  }
}

export function toSourceUrlFromSlug(slug: string[]): string {
  const path = normalizePath(`/${slug.join("/")}`);
  return `https://${SUPPORTOPS_DOCS_HOST}${path}`;
}

export function pathFromSourceUrl(sourceUrl: string): string | null {
  const raw = sourceUrl.trim();
  const normalizedCandidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(normalizedCandidate);
    if (!isSupportOpsDocsHost(parsed.hostname)) {
      return null;
    }
    return normalizePath(parsed.pathname);
  } catch {
    return null;
  }
}
