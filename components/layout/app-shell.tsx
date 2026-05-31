import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Nav } from "@/components/layout/nav";
import { getStoreBackend, getStoreWarnings } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  const chatModel = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini";
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const backend = getStoreBackend();
  const warnings = getStoreWarnings();
  const productionJsonWarning = warnings.find((warning) =>
    warning.toLowerCase().includes("json store is active in production"),
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_45%,_#f8fafc_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">SupportOps AI</p>
            <p className="text-sm text-slate-600">RAG-powered support agent with evals, citations, and escalation.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={hasOpenAIKey ? "info" : "warning"}>
                {hasOpenAIKey ? `AI: OpenAI | ${chatModel} | ${embeddingModel}` : "AI: Fallback keyword mode (no OPENAI_API_KEY)"}
              </Badge>
              <Badge tone={backend === "postgres" ? "success" : "warning"}>
                Store: {backend === "postgres" ? "Postgres + pgvector" : "JSON (ephemeral)"}
              </Badge>
              {productionJsonWarning ? <Badge tone="danger">Production Risk: Non-persistent JSON backend</Badge> : null}
            </div>
          </div>
          <Nav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
