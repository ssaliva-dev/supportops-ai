import { LiveDemo } from "@/components/agent/live-demo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import { ensureSeededData } from "@/lib/seed/ensureSeeded";
import { getStoreWarnings, knowledgeStore, runStore } from "@/lib/store";

export default async function HomePage() {
  await ensureSeededData();

  const [articles, chunks, traces, escalations] = await Promise.all([
    knowledgeStore.listArticles(),
    knowledgeStore.listChunks(),
    runStore.listRecentTraces(50),
    runStore.listEscalations(),
  ]);

  const averageLatency = traces.length
    ? Math.round(traces.reduce((sum, trace) => sum + trace.latencyMs, 0) / traces.length)
    : 0;

  const openEscalations = escalations.filter((item) => !item.resolved).length;
  const escalationRate = traces.length ? (escalations.length / traces.length) * 100 : 0;
  const latestModel = traces[0]?.model ?? "no runs yet";
  const storeWarnings = getStoreWarnings();

  return (
    <div className="space-y-6">
      <Card className="space-y-4 border-slate-300 bg-gradient-to-br from-slate-900 to-sky-900 text-white">
        <Badge tone="info" className="w-fit bg-white/20 text-white">
          Portfolio Project
        </Badge>
        <TitleWithInfo
          as="h1"
          className="text-3xl font-semibold tracking-tight"
          title="AI support agent with citations, evals, and escalation"
          info={TITLE_EXPLANATIONS.landing_overview}
        />
        <p className="max-w-4xl text-sm leading-6 text-slate-100">
          SupportOps AI demonstrates RAG retrieval, source-grounded generation, deterministic evaluations, human-in-the-loop
          escalation, and operational traces with latency and cost tracking.
        </p>
        {storeWarnings.length > 0 ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-100/10 px-3 py-2 text-xs text-amber-100">
            {storeWarnings[0]}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-100">
          <span className="rounded-full bg-white/15 px-3 py-1">RAG + Retrieval Scoring</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Source Citations</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Deterministic Evals</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Trace Observability</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Escalation Queue</span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Knowledge Articles" value={String(articles.length)} />
        <StatCard label="Indexed Chunks" value={String(chunks.length)} />
        <StatCard label="Recent Agent Runs" value={String(traces.length)} />
        <StatCard label="Latest Model" value={latestModel} />
        <StatCard label="Avg Latency" value={`${averageLatency} ms`} />
        <StatCard label="Escalation Rate" value={`${escalationRate.toFixed(1)}%`} />
        <StatCard label="Open Escalations" value={String(openEscalations)} />
      </div>

      <LiveDemo />
    </div>
  );
}
