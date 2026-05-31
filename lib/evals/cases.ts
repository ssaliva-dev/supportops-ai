import type { EvalCase } from "@/types/domain";

export const evalCases: EvalCase[] = [
  {
    id: "refund-policy",
    question: "What is your refund policy for a new Growth monthly subscription?",
    expectedFacts: ["30", "calendar days", "duplicate charge"],
    expectedSources: ["https://docs.supportopsai.dev/billing/refunds"],
    expectedEscalation: false,
  },
  {
    id: "annual-cancellation",
    question: "If I cancel an annual plan today, do I keep access and do I get a prorated refund?",
    expectedFacts: ["stops auto-renewal", "term", "not prorated"],
    expectedSources: ["https://docs.supportopsai.dev/billing/annual-cancellation"],
    expectedEscalation: false,
  },
  {
    id: "enterprise-sso",
    question: "Do you support Okta SSO and is SCIM available?",
    expectedFacts: ["Enterprise", "Okta", "SCIM"],
    expectedSources: ["https://docs.supportopsai.dev/security/enterprise-sso"],
    expectedEscalation: false,
  },
  {
    id: "account-deletion",
    question: "Who can delete a workspace and what happens to access right away?",
    expectedFacts: ["owners can delete", "login is disabled"],
    expectedSources: ["https://docs.supportopsai.dev/accounts/account-deletion"],
    expectedEscalation: false,
  },
  {
    id: "api-rate-limits",
    question: "What are the API rate limits for Standard, Growth, and Enterprise?",
    expectedFacts: ["120 requests per minute", "600", "1200"],
    expectedSources: ["https://docs.supportopsai.dev/api/rate-limits"],
    expectedEscalation: false,
  },
  {
    id: "missing-info-escalate",
    question: "Can you send me your SOC 2 report to my email and confirm audit scope?",
    expectedFacts: ["do not know", "escalate"],
    expectedSources: [],
    expectedEscalation: true,
  },
  {
    id: "conflict-escalate",
    question: "I see docs saying refunds are 30 days and legacy says 14 days. Which one is guaranteed for me?",
    expectedFacts: ["conflict", "escalate"],
    expectedSources: ["https://docs.supportopsai.dev/billing/refunds", "https://docs.supportopsai.dev/legacy/refund-terms"],
    expectedEscalation: true,
  },
  {
    id: "refund-citation",
    question: "How long does a refund take to return to my card after approval?",
    expectedFacts: ["5 to 10 business days"],
    expectedSources: ["https://docs.supportopsai.dev/billing/refunds"],
    expectedEscalation: false,
  },
  {
    id: "legal-guarantee-escalate",
    question: "Can you give a legally binding guarantee of 100% uptime this quarter?",
    expectedFacts: ["escalate"],
    expectedSources: ["https://docs.supportopsai.dev/enterprise/sla"],
    expectedEscalation: true,
  },
];
