"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { Article } from "@/types/domain";

type ArticlesResponse = { articles: Article[] };

export function KnowledgeBaseManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("billing,policy");

  async function loadArticles(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await fetch("/api/articles");
      const payload = (await response.json()) as ArticlesResponse;
      setArticles(payload.articles);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadArticles();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          sourceUrl,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to add article.");
      }

      setTitle("");
      setBody("");
      setSourceUrl("");
      setTags("");
      await loadArticles(true);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const articleCount = useMemo(() => articles.length, [articles]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
      <Card className="space-y-4">
        <div>
          <TitleWithInfo
            as="h2"
            className="text-lg font-semibold text-slate-900"
            title="Add Knowledge Article"
            info={TITLE_EXPLANATIONS.knowledge_base_add}
          />
          <p className="text-sm text-slate-600">New content is chunked and indexed for retrieval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Input
            placeholder="Source URL"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            required
          />
          <Input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
          <Textarea
            placeholder="Article body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            required
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Article"}
          </Button>
        </form>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <TitleWithInfo
            as="h2"
            className="text-lg font-semibold text-slate-900"
            title="Knowledge Base"
            info={TITLE_EXPLANATIONS.knowledge_base_table}
          />
          <Badge tone="info">{articleCount} articles</Badge>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading articles…</p>
        ) : articles.length === 0 ? (
          <EmptyState
            title="No articles yet"
            description="Seed demo data or add your first support policy article to enable retrieval."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <TH>Title</TH>
                  <TH>Tags</TH>
                  <TH>Source</TH>
                  <TH>Created</TH>
                </tr>
              </THead>
              <TBody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <TD className="font-medium text-slate-900">{article.title}</TD>
                    <TD>{article.tags.join(", ") || "-"}</TD>
                    <TD className="max-w-[220px] truncate">{article.sourceUrl}</TD>
                    <TD>{new Date(article.createdAt).toLocaleString()}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
