import { ensureSeededData } from "@/lib/seed/ensureSeeded";
import { runEvalSuite } from "@/lib/evals/runner";

type EvalThresholds = {
  passRate: number;
  retrievalHitRate: number;
  escalationAccuracy: number;
};

function parseThreshold(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

function readThresholds(): EvalThresholds {
  return {
    passRate: parseThreshold(process.env.EVAL_PASS_RATE_MIN, 0.65),
    retrievalHitRate: parseThreshold(process.env.EVAL_RETRIEVAL_HIT_MIN, 0.65),
    escalationAccuracy: parseThreshold(process.env.EVAL_ESCALATION_ACCURACY_MIN, 0.75),
  };
}

async function run(): Promise<void> {
  const thresholds = readThresholds();
  await ensureSeededData();

  const evalRun = await runEvalSuite();
  const { summary } = evalRun;

  const failures: string[] = [];

  if (summary.passRate < thresholds.passRate) {
    failures.push(`passRate ${summary.passRate.toFixed(3)} < ${thresholds.passRate.toFixed(3)}`);
  }

  if (summary.retrievalHitRate < thresholds.retrievalHitRate) {
    failures.push(
      `retrievalHitRate ${summary.retrievalHitRate.toFixed(3)} < ${thresholds.retrievalHitRate.toFixed(3)}`,
    );
  }

  if (summary.escalationAccuracy < thresholds.escalationAccuracy) {
    failures.push(
      `escalationAccuracy ${summary.escalationAccuracy.toFixed(3)} < ${thresholds.escalationAccuracy.toFixed(3)}`,
    );
  }

  console.log(JSON.stringify({ summary, thresholds, failures }, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
