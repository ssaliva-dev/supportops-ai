"use client";

import { useState } from "react";

import { CitationList } from "@/components/agent/citation-list";
import { TracePanel } from "@/components/agent/trace-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { AgentAnswer, Trace } from "@/types/domain";

type AgentApiResponse = {
  answer: AgentAnswer;
  trace: Trace;
};

const DEFAULT_QUESTION = "Can I cancel my annual plan today and keep access until renewal?";

export function LiveDemo() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentApiResponse | null>(null);

  async function handleSubmit(event: React.FormEvent) {
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
    <section className="space-y-4">
      <Card className="space-y-4 border-slate-300">
        <TitleWithInfo
          as="h2"
          className="text-xl font-semibold text-slate-900"
          title="Live Support Agent Demo"
          info={TITLE_EXPLANATIONS.landing_demo}
        />
        <p className="text-sm text-slate-600">
          Ask a customer support question. The agent returns a source-grounded answer, citations, confidence, latency,
          cost estimate, and escalation recommendation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a support question" />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? "Running…" : "Run Demo"}
          </Button>
        </form>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      </Card>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Confidence" value={result.answer.confidence.toFixed(2)} />
            <StatCard label="Latency" value={`${result.trace.latencyMs} ms`} />
            <StatCard label="Estimated Cost" value={`$${result.trace.estimatedCostUsd.toFixed(6)}`} />
            <StatCard
              label="Escalation"
              value={result.answer.shouldEscalate ? "Recommended" : "Not Required"}
              detail={result.answer.escalationReason ?? "-"}
            />
          </div>

          <Card className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Agent Answer</h3>
              {result.answer.shouldEscalate ? <Badge tone="warning">Escalate</Badge> : <Badge tone="success">Grounded</Badge>}
            </div>
            <p className="text-sm leading-6 text-slate-800">{result.answer.answer}</p>
          </Card>

          <CitationList citations={result.answer.citations} />
          <TracePanel trace={result.trace} />
        </>
      ) : null}
    </section>
  );
}
