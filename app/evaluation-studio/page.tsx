import { EvalStudio } from "@/components/evals/eval-studio";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import { ensureSeededData } from "@/lib/seed/ensureSeeded";

export default async function EvaluationStudioPage() {
  await ensureSeededData();

  return (
    <div className="space-y-4">
      <div>
        <TitleWithInfo
          as="h1"
          className="text-2xl font-semibold text-slate-900"
          title="Evaluation Studio"
          info={TITLE_EXPLANATIONS.evaluation_page}
        />
        <p className="text-sm text-slate-600">
          Run golden test cases and inspect pass/fail, groundedness, retrieval hits, and escalation correctness.
        </p>
      </div>
      <EvalStudio />
    </div>
  );
}
