export type TitleInfoKey =
  | "landing_overview"
  | "knowledge_base_page"
  | "knowledge_base_add"
  | "knowledge_base_table"
  | "support_agent_page"
  | "support_workflow"
  | "evaluation_page"
  | "evaluation_runner"
  | "escalation_page"
  | "escalation_create_article";

export const TITLE_EXPLANATIONS: Record<TitleInfoKey, string> = {
  landing_overview:
    "Built a production-style AI support demo that combines retrieval-augmented generation, source citations, deterministic evaluations, and escalation workflows so support answers stay verifiable.",
  knowledge_base_page:
    "Built a manual knowledge ingestion page so policy content can be added and updated quickly, then chunked and indexed for retrieval without redeploying the app.",
  knowledge_base_add:
    "Built this form to create support articles with title, body, tags, and source URL so the agent can ground answers in explicit documentation.",
  knowledge_base_table:
    "Built this table to audit the active knowledge corpus and validate that source material is present, tagged, and timestamped before relying on it in customer answers.",
  support_agent_page:
    "Built this page to simulate real support operations: ask a customer question, retrieve evidence, produce a grounded answer, and expose confidence plus escalation decisions.",
  support_workflow:
    "Built this workflow to enforce source-grounded responses. It retrieves context, generates a constrained answer, cites evidence, and escalates when confidence is low or context is weak.",
  evaluation_page:
    "Built the evaluation surface to run golden test cases and measure reliability, groundedness, retrieval quality, latency, and escalation accuracy over time.",
  evaluation_runner:
    "Built this deterministic eval runner so behavior can be verified repeatedly without relying only on LLM-as-judge scoring.",
  escalation_page:
    "Built the escalation queue to capture uncertain or risky responses so humans can resolve cases and feed missing knowledge back into the system.",
  escalation_create_article:
    "Built this follow-up form so escalated cases can be converted into new knowledge-base documentation, closing gaps that caused escalation.",
};
