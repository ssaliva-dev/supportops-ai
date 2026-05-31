import type { EscalationReason } from "@/types/domain";

const LEGAL_FINANCIAL_PATTERNS = [
  /legal guarantee/i,
  /financial guarantee/i,
  /guarantee/i,
  /binding commitment/i,
  /indemnif/i,
  /liability/i,
  /contractual guarantee/i,
];

export function isLegalOrFinancialGuaranteeRequest(question: string): boolean {
  return LEGAL_FINANCIAL_PATTERNS.some((pattern) => pattern.test(question));
}

export function selectEscalationReason(args: {
  hasRelevantContext: boolean;
  hasConflict: boolean;
  isLegalOrFinancial: boolean;
  confidence: number;
  minimumConfidence: number;
}): EscalationReason | undefined {
  if (!args.hasRelevantContext) {
    return "NO_RELEVANT_CONTEXT";
  }

  if (args.hasConflict) {
    return "CONFLICTING_SOURCES";
  }

  if (args.isLegalOrFinancial) {
    return "LEGAL_OR_FINANCIAL_REQUEST";
  }

  if (args.confidence < args.minimumConfidence) {
    return "LOW_CONFIDENCE";
  }

  return undefined;
}
