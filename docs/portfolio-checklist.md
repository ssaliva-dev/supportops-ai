# Portfolio Readiness Checklist

## Live Smoke Checks
- [ ] `/` loads and shows metric cards + live demo form.
- [ ] `/knowledge-base` loads article list and allows adding an article.
- [ ] `/support-agent` returns answer, citations, confidence, escalation, and trace.
- [ ] `/evaluation-studio` runs evals and renders summary table.
- [ ] `/escalation-queue` shows unresolved items and resolve/add-article actions.
- [ ] `/api/health` returns `ok`, `ready`, `backend`, and `warnings`.

## AI Behavior
- [ ] Agent declines unknown questions and recommends escalation.
- [ ] Answers include source citations when context exists.
- [ ] Escalation triggers on missing context, low confidence, conflict, legal/financial guarantees.
- [ ] Trace includes rewritten query, retrieval details, model, tokens, latency, and cost.

## Evidence for Recruiters
- [ ] Capture screenshots in docs/screenshots.
- [ ] Keep a fresh eval summary artifact from `npm run evals:check`.
- [ ] Verify README live URL, architecture, demo script, and limitations are current.
- [ ] Keep RELEASE_NOTES.md updated per public milestone.

## Deployment Safety
- [ ] `npm run lint`, `npm test`, and `npm run build` pass locally.
- [ ] CI Quality Gates workflow passes.
- [ ] Deploy workflow smoke checks pass for preview/production.
- [ ] Rollback target identified in Vercel Deployments.
