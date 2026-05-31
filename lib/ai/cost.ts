import { COST_TABLE, MODEL_CONFIG } from "@/lib/config";
import type { TokenUsage } from "@/types/domain";

export function estimateCostUsd(tokenUsage?: TokenUsage, model = MODEL_CONFIG.answerModel): number {
  if (!tokenUsage) {
    return 0;
  }

  const pricing = COST_TABLE[model];
  if (!pricing) {
    return 0;
  }

  const inputCost = (tokenUsage.prompt / 1_000_000) * pricing.inputPer1M;
  const outputCost = (tokenUsage.completion / 1_000_000) * pricing.outputPer1M;

  return Number((inputCost + outputCost).toFixed(6));
}
