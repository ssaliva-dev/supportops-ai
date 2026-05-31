import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ensureSeededData } from "@/lib/seed/ensureSeeded";
import { knowledgeStore } from "@/lib/store";
import { pathFromSourceUrl, toSourceUrlFromSlug } from "@/lib/utils/source-doc";
import type { Article } from "@/types/domain";

type SourceDocPageProps = {
  params: Promise<{ slug: string[] }>;
};

function formatArticleBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findArticleBySourcePath(articles: Article[], sourcePath: string): Article | undefined {
  return articles.find((article) => pathFromSourceUrl(article.sourceUrl) === sourcePath);
}

export default async function SourceDocPage({ params }: SourceDocPageProps) {
  const { slug } = await params;
  await ensureSeededData();

  const sourceUrl = toSourceUrlFromSlug(slug);
  const sourcePath = pathFromSourceUrl(sourceUrl);
  const articles = await knowledgeStore.listArticles();
  const article = sourcePath ? findArticleBySourcePath(articles, sourcePath) : undefined;

  if (!article) {
    return (
      <div className="space-y-4">
        <Card className="space-y-3">
          <p className="text-xl font-semibold text-slate-900">Source document not found</p>
          <p className="text-sm text-slate-600">
            This citation points to a documentation path that is not currently in the knowledge base.
          </p>
          <p className="text-sm text-slate-700">{sourceUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/knowledge-base"
              className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Open Knowledge Base
            </Link>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Open Original URL
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-2xl font-semibold text-slate-900">{article.title}</p>
        <p className="text-xs text-slate-500">Source URL: {article.sourceUrl}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-800">
              {tag}
            </span>
          ))}
        </div>
        <div className="space-y-3 text-sm leading-6 text-slate-800">
          {formatArticleBody(article.body).map((paragraph, index) => (
            <p key={`${article.id}_p_${index + 1}`}>{paragraph}</p>
          ))}
        </div>
        <div className="pt-1">
          <Link
            href="/knowledge-base"
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to Knowledge Base
          </Link>
        </div>
      </Card>
    </div>
  );
}

