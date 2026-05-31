import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Citation } from "@/types/domain";

type CitationListProps = {
  citations: Citation[];
};

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No citations returned for this answer.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cited Sources</h3>
      <ul className="space-y-3">
        {citations.map((citation) => (
          <li key={citation.chunkId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{citation.title}</p>
              <Badge tone="info">score {citation.score.toFixed(2)}</Badge>
            </div>
            <p className="text-sm text-slate-700">{citation.snippet}</p>
            <p className="mt-2 text-xs text-slate-500">{citation.sourceUrl}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
