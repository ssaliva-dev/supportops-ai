import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TitleWithInfo } from "@/components/ui/title-with-info";
import { TITLE_EXPLANATIONS } from "@/lib/content/title-explanations";
import { toSourceDocumentHref } from "@/lib/utils/source-doc";
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
      <TitleWithInfo
        as="h3"
        className="text-sm font-semibold uppercase tracking-wide text-slate-500"
        title="Cited Sources"
        info={TITLE_EXPLANATIONS.citation_panel}
      />
      <ul className="space-y-3">
        {citations.map((citation) => {
          const baseHref = toSourceDocumentHref(citation.sourceUrl);
          const isInternalSourceDoc = baseHref.startsWith("/source-docs/");
          const href = isInternalSourceDoc ? `${baseHref}?src=${encodeURIComponent(citation.chunkId)}` : baseHref;

          return (
            <li key={citation.chunkId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{citation.title}</p>
                <Badge tone="info">score {citation.score.toFixed(2)}</Badge>
              </div>
              <p className="text-sm text-slate-700">{citation.snippet}</p>
              <a
                href={href}
                target={isInternalSourceDoc ? undefined : "_blank"}
                rel={isInternalSourceDoc ? undefined : "noreferrer noopener"}
                className="mt-2 inline-block text-xs font-medium text-sky-700 underline underline-offset-2 hover:text-sky-600"
              >
                {citation.sourceUrl}
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
