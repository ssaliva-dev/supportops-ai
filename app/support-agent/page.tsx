import { AgentWorkbench } from "@/components/agent/agent-workbench";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import { ensureSeededData } from "@/lib/seed/ensureSeeded";

export default async function SupportAgentPage() {
  await ensureSeededData();

  return (
    <div className="space-y-4">
      <div>
        <TitleWithInfo
          as="h1"
          className="text-2xl font-semibold text-slate-900"
          title="Support Agent"
          info={TITLE_EXPLANATIONS.support_agent_page}
        />
        <p className="text-sm text-slate-600">
          Ask customer questions. Answers are constrained to retrieved context and include escalation decisions when needed.
        </p>
      </div>
      <AgentWorkbench />
    </div>
  );
}
