# AGENTS.md
## Project Goal
Build and maintain SupportOps AI, a production-style AI support agent portfolio project demonstrating RAG, source-grounded answers, evals, observability, and human-in-the-loop escalation.
## Engineering Principles
- Prefer working, demoable features over abstract architecture.
- Keep AI logic separated from UI.
- Use TypeScript types for all core entities.
- Do not hardcode secrets.
- Include graceful fallbacks when OpenAI API keys are missing.
- Make all portfolio-facing UI polished and recruiter-friendly.
- Prioritize verifiable behavior: tests, evals, traces, and build checks.
## Expected Commands
Use the available package manager based on lockfile.
Typical commands:
- npm install
- npm run dev
- npm run build
- npm run lint
- npm test
## Code Organization
- app/: Next.js routes and pages
- components/: reusable UI components
- lib/ai/: prompts, LLM calls, embeddings
- lib/rag/: chunking, retrieval, scoring
- lib/evals/: evaluation runner and scoring
- lib/store/: persistence abstraction
- types/: shared TypeScript types
## AI Rules
- The agent must answer only from retrieved context.
- The agent must cite sources.
- The agent must escalate when context is missing, weak, or conflicting.
- The system should expose traces for debugging and interviews.
- Evaluation should include deterministic checks, not only LLM-as-judge.
## Definition of Done
Before finishing a task:
- Run build if possible.
- Run lint/tests if configured.
- Update README if behavior or setup changes.
- Ensure the app remains demoable locally.
