import { EscalationQueue } from "@/components/escalations/escalation-queue";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";

export default function EscalationQueuePage() {
  return (
    <div className="space-y-4">
      <div>
        <TitleWithInfo
          as="h1"
          className="text-2xl font-semibold text-slate-900"
          title="Escalation Queue"
          info={TITLE_EXPLANATIONS.escalation_page}
        />
        <p className="text-sm text-slate-600">
          Cases with low confidence, missing context, conflicting sources, or legal/financial guarantee requests.
        </p>
      </div>
      <EscalationQueue />
    </div>
  );
}
