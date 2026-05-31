import { ensureSeededData } from "@/lib/seed/ensureSeeded";
import { runEvalSuite } from "@/lib/evals/runner";

async function run(): Promise<void> {
  await ensureSeededData();
  const result = await runEvalSuite();
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
