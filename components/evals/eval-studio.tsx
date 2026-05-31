"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { EvalRunResponse } from "@/types/domain";

export function EvalStudio() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvalRunResponse | null>(null);

  async function runEvals() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evals", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Eval request failed");
      }
      const payload = (await response.json()) as EvalRunResponse;
      setResult(payload);
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <TitleWithInfo
          as="h2"
          className="text-lg font-semibold text-slate-900"
          title="Evaluation Studio"
          info={TITLE_EXPLANATIONS.evaluation_runner}
        />
        <p className="text-sm text-slate-600">
          Deterministic eval suite validates retrieval hits, citation presence, escalation accuracy, groundedness, and
          latency.
        </p>
        <Button onClick={runEvals} disabled={loading}>
          {loading ? "Running Evals…" : "Run Evals"}
        </Button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </Card>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Pass Rate" value={`${(result.summary.passRate * 100).toFixed(1)}%`} />
            <StatCard label="Avg Groundedness" value={result.summary.averageGroundedness.toFixed(2)} />
            <StatCard label="Avg Latency" value={`${result.summary.averageLatencyMs.toFixed(0)} ms`} />
            <StatCard label="Escalation Accuracy" value={`${(result.summary.escalationAccuracy * 100).toFixed(1)}%`} />
            <StatCard label="Retrieval Hit Rate" value={`${(result.summary.retrievalHitRate * 100).toFixed(1)}%`} />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <TH>Case</TH>
                    <TH>Pass</TH>
                    <TH>Groundedness</TH>
                    <TH>Retrieval</TH>
                    <TH>Citation</TH>
                    <TH>Escalation</TH>
                    <TH>Latency</TH>
                  </tr>
                </THead>
                <TBody>
                  {result.results.map((item) => (
                    <tr key={item.caseId}>
                      <TD>
                        <p className="font-medium text-slate-900">{item.caseId}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.question}</p>
                      </TD>
                      <TD>{item.pass ? <Badge tone="success">Pass</Badge> : <Badge tone="danger">Fail</Badge>}</TD>
                      <TD>{item.groundedness.toFixed(2)}</TD>
                      <TD>{item.retrievalHit ? "hit" : "miss"}</TD>
                      <TD>{item.citationPresent ? "yes" : "no"}</TD>
                      <TD>{item.escalationCorrect ? "correct" : "wrong"}</TD>
                      <TD>{item.latencyMs} ms</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        <EmptyState
          title="No eval run yet"
          description="Run the suite to produce case-level results and summary metrics."
        />
      )}
    </div>
  );
}
