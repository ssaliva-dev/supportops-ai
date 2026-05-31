# Release Notes

## v1.0.0 - Portfolio Readiness Baseline (2026-05-31)

### Added
- Live health endpoint with readiness warnings (`/api/health`).
- Store backend visibility and production-risk badge in the app header.
- Additional observability stats on landing/support flows.
- CI Quality Gates workflow (`lint`, `test`, `build`, non-blocking eval threshold check).
- Deploy smoke checks in Vercel deployment workflow.
- Portfolio documentation pack:
  - docs/portfolio-checklist.md
  - docs/sample-trace.json

### Changed
- Vercel framework explicitly set to Next.js in `vercel.json` to avoid routing/output mismatches.
- README expanded with live URL guidance, eval thresholds, operational workflow, and known limitations.

### Current Known Limitation
- If `STORE_BACKEND=json` is used in production, data persistence is not durable across deployments/instances.
  Use Postgres + pgvector for stable portfolio demos.
