"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { Escalation } from "@/types/domain";

type EscalationResponse = {
  escalations: Escalation[];
};

export function EscalationQueue() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("escalation,follow-up");
  const [body, setBody] = useState("");

  async function loadEscalations(showLoading = false) {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const response = await fetch("/api/escalations");
      const payload = (await response.json()) as EscalationResponse;
      setItems(payload.escalations);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEscalations();
  }, []);

  async function markResolved(id: string) {
    await fetch(`/api/escalations/${id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await loadEscalations(true);
  }

  async function addArticleFromEscalation(event: React.FormEvent) {
    event.preventDefault();
    if (!draftId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sourceUrl,
          body,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to create article from escalation.");
      }

      await markResolved(draftId);
      setDraftId(null);
      setTitle("");
      setSourceUrl("");
      setBody("");
      setTags("escalation,follow-up");
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  const openItems = useMemo(() => items.filter((item) => !item.resolved), [items]);

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-600">Loading escalation queue…</p>
        </Card>
      ) : openItems.length === 0 ? (
        <EmptyState title="Queue is clear" description="No unresolved escalations right now." />
      ) : (
        <div className="space-y-4">
          {openItems.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="warning">{item.reason}</Badge>
                  <Badge tone="info">confidence {item.confidence.toFixed(2)}</Badge>
                </div>
              </div>
              <p className="text-sm text-slate-700">{item.answer}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => markResolved(item.id)}>
                  Mark Resolved
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDraftId(item.id);
                    setTitle(`Follow-up: ${item.question.slice(0, 70)}`);
                    setBody(`Escalated question:\n${item.question}\n\nResolution notes:\n`);
                    setSourceUrl("https://docs.supportopsai.dev/internal/escalation-resolution");
                  }}
                >
                  Add Missing KB Article
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {draftId ? (
        <Card className="space-y-3 border-sky-200">
          <TitleWithInfo
            as="h3"
            className="text-base font-semibold text-slate-900"
            title="Create Knowledge Article from Escalation"
            info={TITLE_EXPLANATIONS.escalation_create_article}
          />
          <form onSubmit={addArticleFromEscalation} className="space-y-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Article title" />
            <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} required placeholder="Source URL" />
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags" />
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} required />
            <div className="flex gap-2">
              <Button type="submit">Save Article and Resolve</Button>
              <Button type="button" variant="ghost" onClick={() => setDraftId(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
