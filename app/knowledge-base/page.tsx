import { KnowledgeBaseManager } from "@/components/knowledge/knowledge-base-manager";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import { ensureSeededData } from "@/lib/seed/ensureSeeded";

export default async function KnowledgeBasePage() {
  await ensureSeededData();

  return (
    <div className="space-y-4">
      <div>
        <TitleWithInfo
          as="h1"
          className="text-2xl font-semibold text-slate-900"
          title="Knowledge Base"
          info={TITLE_EXPLANATIONS.knowledge_base_page}
        />
        <p className="text-sm text-slate-600">
          Add support articles manually. The system chunks content and uses embeddings when OpenAI credentials are available.
        </p>
      </div>
      <KnowledgeBaseManager />
    </div>
  );
}
