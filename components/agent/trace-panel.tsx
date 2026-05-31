import { Card } from "@/components/ui/card";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import type { Trace } from "@/types/domain";

type TracePanelProps = {
  trace: Trace | null;
};

export function TracePanel({ trace }: TracePanelProps) {
  if (!trace) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Run the agent to inspect trace details.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <TitleWithInfo
        as="h3"
        className="text-sm font-semibold uppercase tracking-wide text-slate-500"
        title="Trace"
        info={TITLE_EXPLANATIONS.trace_panel}
      />
      <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
        <p>
          <span className="font-semibold">Rewritten query:</span> {trace.rewrittenQuery}
        </p>
        <p>
          <span className="font-semibold">Model:</span> {trace.model}
        </p>
        <p>
          <span className="font-semibold">Retrieval mode:</span> {trace.retrievalMode}
        </p>
        <p>
          <span className="font-semibold">Latency:</span> {trace.latencyMs} ms
        </p>
        <p>
          <span className="font-semibold">Estimated cost:</span> ${trace.estimatedCostUsd.toFixed(6)}
        </p>
        <p>
          <span className="font-semibold">Token usage:</span>{" "}
          {trace.tokenUsage
            ? `${trace.tokenUsage.prompt}/${trace.tokenUsage.completion}/${trace.tokenUsage.total}`
            : "N/A"}
        </p>
      </div>
      <div className="rounded-md bg-slate-950 p-3 text-xs text-slate-200">
        <p>Top score: {trace.retrieval.topScore.toFixed(3)}</p>
        <p>Average score: {trace.retrieval.averageScore.toFixed(3)}</p>
        <p>Has conflict: {trace.retrieval.hasConflict ? "yes" : "no"}</p>
        <p>Chunk ids: {trace.retrieval.selectedChunkIds.join(", ") || "none"}</p>
      </div>
    </Card>
  );
}
