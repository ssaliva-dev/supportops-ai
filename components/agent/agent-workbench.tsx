"use client";

import { useState } from "react";

import { CitationList } from "@/components/agent/citation-list";
import { TracePanel } from "@/components/agent/trace-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { AgentAnswer, Trace } from "@/types/domain";

type AgentApiResponse = {
  answer: AgentAnswer;
  trace: Trace;
};

export function AgentWorkbench() {
  const [question, setQuestion] = useState("A customer says their renewal payment failed. What happens next?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentApiResponse | null>(null);

  async function handleAsk(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Request failed");
      }
      const payload = (await response.json()) as AgentApiResponse;
      setResult(payload);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <Card className="space-y-4">
          <TitleWithInfo
            as="h2"
            className="text-lg font-semibold text-slate-900"
            title="Support Agent Workflow"
            info={TITLE_EXPLANATIONS.support_workflow}
          />
          <form className="space-y-3" onSubmit={handleAsk}>
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder="Paste a customer message here"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? "Analyzing…" : "Generate Answer"}
            </Button>
          </form>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </Card>

        {result ? (
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Answer</h3>
              {result.answer.shouldEscalate ? <Badge tone="warning">Escalate</Badge> : <Badge tone="success">Clear</Badge>}
            </div>
            <p className="text-sm leading-6 text-slate-800">{result.answer.answer}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Confidence" value={result.answer.confidence.toFixed(2)} />
              <StatCard label="Latency" value={`${result.trace.latencyMs} ms`} />
              <StatCard label="Estimated Cost" value={`$${result.trace.estimatedCostUsd.toFixed(6)}`} />
              <StatCard label="Model" value={result.trace.model} />
            </div>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>
                <span className="font-semibold">Escalation reason:</span> {result.answer.escalationReason ?? "Not required"}
              </p>
              <p>
                <span className="font-semibold">Retrieved chunks:</span> {result.trace.retrieval.selectedChunkIds.length}
              </p>
            </div>
          </Card>
        ) : null}

        <CitationList citations={result?.answer.citations ?? []} />
      </div>

      <TracePanel trace={result?.trace ?? null} />
    </div>
  );
}
