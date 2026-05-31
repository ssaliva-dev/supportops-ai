import { describe, expect, it } from "vitest";

import { isLegalOrFinancialGuaranteeRequest, selectEscalationReason } from "@/lib/ai/escalation";

describe("escalation rules", () => {
  it("flags legal or financial guarantee requests", () => {
    expect(isLegalOrFinancialGuaranteeRequest("Can you provide a legal guarantee of uptime?")).toBe(true);
    expect(isLegalOrFinancialGuaranteeRequest("How do I reset my password?")).toBe(false);
  });

  it("prioritizes missing context before low confidence", () => {
    const reason = selectEscalationReason({
      hasRelevantContext: false,
      hasConflict: false,
      isLegalOrFinancial: false,
      confidence: 0.8,
      minimumConfidence: 0.6,
    });

    expect(reason).toBe("NO_RELEVANT_CONTEXT");
  });

  it("returns low confidence when context exists but score is low", () => {
    const reason = selectEscalationReason({
      hasRelevantContext: true,
      hasConflict: false,
      isLegalOrFinancial: false,
      confidence: 0.3,
      minimumConfidence: 0.6,
    });

    expect(reason).toBe("LOW_CONFIDENCE");
  });
});
